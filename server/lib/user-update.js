import userPayload from "./user-payload";
import getRooms from "./get-rooms";

module.exports = function factory({ sendUpdate, store }) {
  return function handle({ ship, client }, { events, user, segments, account }) {
    const update = userPayload({ user, events, account, segments, client, ship });
    const userClient = client.asUser(user);
    const rooms = getRooms(user);

    userClient.logger.info("outgoing.user.start", { rooms, update });

    // Prevents trying to create LRU for random Ship IDs.
    store.get(ship.id).then(function hasShipCached(cached) {
      if (!cached) return userClient.logger.info("outgoing.user.skip", { update });
      return store.lru(ship.id)
      .set(user.id, update)
      .then(() => {
        if (update.message === "ok") {
          userClient.logger.info("outgoing.user.success", { rooms, update });
          sendUpdate({ ship, update, rooms });
        } else {
          userClient.logger.info("outgoing.user.skip", { rooms, update });
        }
      });
    });
  };
};
