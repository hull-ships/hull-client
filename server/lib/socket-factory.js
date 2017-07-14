import URI from "urijs";
import _ from "lodash";
import userPayload from "./user-payload";

const fetchUser = ({ client, ship, id }) => {
  return client
    .asUser({ id })
    .get(`/${id}/user_report`)
    .then((user) => {
      if (!user || !user.id) throw new Error("No user found", user);
      return userPayload({ user, ship, client });
    }, (err) => {
      throw err;
    });
};

export default function socketFactory({ Hull, store, sendUpdate }) {
  const { get, lru } = store;
  return function onConnection(socket) {
    const close = (client, message = "Closing", action = "outgoing.user.fetch.error") => {
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
          const userClient = client.asUser(query);

          // userClient.logger.debug("user.fetch.check", { ship: !!ship, client: !!client });

          // Warn if no valid domains specified.
          if (!whitelisted_domains.length) return close(userClient, "No whitelisted domains", "incoming.connection.error");

          // Only continue if domain is whitelisted.
          userClient.logger.debug("incoming.connection.check", { origin: URI(origin).hostname() });
          if (!_.includes(_.map(whitelisted_domains, d => URI(d).hostname()), URI(origin).hostname())) {
            return close(client, `Unauthorized domain ${URI(origin).hostname()}`, "incoming.connection.error");
          }

          userClient.logger.info("incoming.connection.success");

          // Starting the actual outgoing data sequence

          // Join User to channel with this Hull user id.
          _.map(query, (v) => {
            userClient.logger.info("incoming.user.join-channel", v);
            socket.join(v);
          });

          // If we have a Hull ID, then can use LRU. Othwerwise, we wait for the Update to send through websockets.
          if (query.id) {
            userClient.logger.info("outgoing.user.fetch.start", query);
            lru(id).getOrSet(query.id, () => fetchUser({ client, ship, id }), 30000)
            .then((update) => {
              userClient.logger.info("outgoing.user.fetch.success", { id: query.id, update });
              // Once joined, send update.
              sendUpdate({ ship, update });
            }, (err) => {
              socket.emit("user.error", { message: "not_found", user: {}, segments: {} });
              close(client, err.message);
              throw err;
            });
          }
          return true;
        },

        (err) => {
          Hull.logger.error("outgoing.user.fetch.error", { message: err });
          throw err;
        }
      );
      return true;
    });
  };
}
