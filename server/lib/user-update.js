import userPayload from "./user-payload";

module.exports = function factory({ sendUpdate, store }) {
  const { lru } = store;
  return function handle({ ship, client }, { user, segments }) {
    const update = userPayload({ user, segments, client, ship });
    client.logger.info("outgoing.user.start", { id: user.id, update });

    // Cache the response
    const cache = lru(ship.id);
    if (!cache) {
      return sendUpdate({ ship, user, update });
    }
    return cache
    .set(user.id, update)
    .then(() => {
      if (update.message === "ok") {
        client.asUser(user).logger.info("outgoing.user.success", { id: user.id, update });
        // Then send it out
        sendUpdate({ ship, user, update });
      } else {
        client.asUser(user).logger.info("outgoing.user.skip", { id: user.id, update });
      }
    });
  };
};
