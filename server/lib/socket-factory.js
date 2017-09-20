import URI from "urijs";
import _ from "lodash";
import userPayload from "./user-payload";
import getRooms from "./get-rooms";

const fetchUser = ({ client, ship }) => client
  .get("/me/user_report")
  .then((user) => {
    if (!user || !user.id) {
      client.logger.info("outgoing.user.error", { message: "Not found" });
      throw new Error("No user found", user);
    }
    client.logger.info("outgoing.user.success");
    const { account } = user;

    return {
      user: _.omit(user, "account"),
      account,
      update: userPayload({ user, ship, client })
    };
  }, (err) => {
    client.logger.info("outgoing.user.error", { error: err });
    throw err;
  });

const getOneIdentier = (q = {}) => q.id || q.external_id || q.email || q.anonymous_id;

export default function socketFactory({ Hull, store, sendUpdate }) {
  const { get, lru } = store;
  return function onConnection(socket) {
    const close = (client, message = "closing connection", action = "incoming.user.fetch.error") => {
      socket.emit("close", { message });
      socket.disconnect(true);
      client.logger.error(action, { message });
    };
    Hull.logger.debug("incoming.connection.start");

    socket.on("user.fetch", ({ id, query = {} }) => {
      if (!_.size(query)) return close(Hull, `Empty Query (${id})`, "incoming.connection.error");
      const { origin } = socket.request.headers;
      if (!origin) return close(`Not connecting socket: No Origin (${id})`, "incoming.connection.error");


      get(id)
        .then((cached) => {
          const { config, ship } = cached;
          if (!cached || !_.size(ship)) return close(Hull, "Cloud not find config in redis cache. will try at next page view");

          const { private_settings = {} } = ship;
          const { whitelisted_domains = [] } = private_settings;

          const client = new Hull({ ...config, id });
          const userClient = client.asUser(query, { scopes: ["admin"] });

          // userClient.logger.debug("user.fetch.check", { ship: !!ship, client: !!client });

          // Warn if no valid domains specified.
          if (!whitelisted_domains.length) return close(userClient, "No whitelisted domains", "incoming.connection.error");

          // Only continue if domain is whitelisted.
          userClient.logger.debug("incoming.connection.check", { origin: URI(origin).hostname() });
          if (!_.includes(_.map(whitelisted_domains, d => URI(`https://${d.replace(/http(s)?:\/\//, "")}`).hostname()), URI(origin).hostname())) {
            return close(client, `Unauthorized domain ${URI(origin).hostname()}. Authorized: ${JSON.stringify(_.map(whitelisted_domains, d => URI(d).hostname()))}`, "incoming.connection.error");
          }

          userClient.logger.info("incoming.connection.success");

          // Starting the actual outgoing data sequence

          // Join User to channel with this Hull user id.
          // _.map(query, (v) => {
          //   userClient.logger.info("incoming.user.join-room", v);
          //   socket.join(v);
          //   socket.emit("room.joined", v);
          // });

          // Only join one room to avoid multi-posting
          const identifier = getOneIdentier(query);
          userClient.logger.info("incoming.user.join-room", identifier);
          socket.join(identifier);
          socket.emit("room.joined", identifier);

          // If we have a Hull ID, then can use LRU. Othwerwise, we wait for the Update to send through websockets.
          userClient.logger.info("incoming.user.fetch.start", query);
          const firstId = query.id || query.external_id || query.anonymous_id;

          lru(id).getOrSet(firstId, () => fetchUser({ client: userClient, ship, id }), 30000)
          .then(({ user, update }) => {
            userClient.logger.info("incoming.user.fetch.success", { update });

            // Once joined, send update.
            sendUpdate({ ship, update, rooms: getRooms(user) });
          }, (err = {}) => {
            socket.emit("user.error", { message: "not_found", user: {}, segments: {} });
            console.log("user error", err);
            close(client, err.message);
            throw err;
          });
          return true;
        },

        (err) => {
          Hull.logger.error("incoming.user.fetch.error", { message: err });
          throw err;
        }
      );
      return true;
    });
  };
}
