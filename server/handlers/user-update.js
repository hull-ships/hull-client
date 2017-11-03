module.exports = function factory({ sendPayload, store }) {
  const { get, lru } = store;
  return async function handle(
    { ship, client },
    { events, user, segments, account }
  ) {
    const { logger } = client.asUser(user);

    try {
      // Refresh LRU cache;
      await lru(ship.id).set(user.id, { user, account, segments });
      sendPayload({ ship, user, account, segments, client, events });
    } catch (err) {
      logger.error("outgoing.user.error", { message: err });
    }
  };
};
