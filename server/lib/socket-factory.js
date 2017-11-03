import URI from "urijs";
import _ from "lodash";
import fetchUser from "./fetch-user";

const USER_NOT_FOUND = {
  message: "not_found",
  user: {},
  account: {},
  segments: {}
};

const getIdentifier = (q = {}) => (q.id || q.external_id || q.email || q.anonymous_id);
const loggerFactory = (socket, Hull) => (action = "incoming.user.fetch.error", message = "closing connection", client = Hull) => {
  socket.emit("close", { message });
  socket.disconnect(true);
  client.logger.error(action, { message });
};
const isWhitelisted = (domains, hostname) => _.includes(_.map(domains, d => URI(`https://${d.replace(/http(s)?:\/\//, "")}`).hostname()), hostname);

export default function socketFactory({ Hull, store, sendPayload }) {
  const { get, lru } = store;

  return async function onConnection(socket) {
    const logClose = loggerFactory(socket, Hull);
    Hull.logger.debug("incoming.connection.start");

    async function onUserFetch({ shipId, platformId, claims = {} }) {
      if (!_.size(claims)) {
        return logClose("incoming.connection.error", `Empty Claims (${shipId})`);
      }

      const { origin } = socket.request.headers;

      if (!origin) {
        return logClose("incoming.connection.error", `Not connecting socket: No Origin (${shipId})`);
      }

      try {
        const cached = await get(shipId);
        const { config, ship } = cached;

        if (!cached || !_.size(ship)) {
          return logClose("incoming.connection.error", "Cloud not find config in redis cache. will try at next page view");
        }

        const { private_settings = {} } = ship;
        const { whitelisted_domains = [] } = private_settings;
        const client = new Hull({ ...config, id: shipId });
        const userClient = client.asUser(claims, { scopes: ["admin"] });

        const platformData = await client.get(platformId);
        console.log(platformData);

        if (!whitelisted_domains.length) {
          return logClose("incoming.connection.error", "No whitelisted domains", userClient);
        }

        userClient.logger.debug("incoming.connection.check", { origin: URI(origin).hostname() });

        // Only continue if domain is whitelisted.
        const hostname = URI(origin).hostname();
        const whitelisted = isWhitelisted(whitelisted_domains, hostname);

        if (!whitelisted) {
          return logClose("incoming.connection.error", `Unauthorized domain ${hostname}. Authorized: ${JSON.stringify(_.map(whitelisted_domains, d => URI(d).hostname()))}`, client);
        }

        // Starting the actual outgoing data sequence
        userClient.logger.info("incoming.connection.success");

        // Only join one room to avoid multi-posting
        const identifier = getIdentifier(claims);

        userClient.logger.info("incoming.user.joinRoom", identifier);
        socket.join(identifier);
        socket.emit("room.joined", identifier);

        userClient.logger.info("incoming.user.fetch.start", claims);

        try {
          let payload;
          // If we have a Hull ID, then can use LRU. Othwerwise, we wait for the Update to send through websockets.
          if (claims.id) {
            payload = await lru(shipId).get(claims.id);
          }

          if (!payload) {
            socket.emit("cache.miss", { shipId, claims });
            payload = await fetchUser(userClient);
          }

          if (!payload) {
            throw new Error("Can't find user");
          }

          // Once joined, send payload.
          userClient.logger.info("incoming.user.fetch.success");

          sendPayload({ client: userClient, ship, ...payload });
        } catch (err) {
          // Error happened, send no one.
          socket.emit("user.error", USER_NOT_FOUND);
          logClose(client, err.message);
          throw err;
        }
      } catch (err) {
        Hull.logger.error("incoming.user.fetch.error", { message: err });
        throw err;
      }
      return true;
    }

    socket.on("user.fetch", onUserFetch);
  };
}
