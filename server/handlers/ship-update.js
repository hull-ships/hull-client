export default function shipUpdateFactory({ store, onConnection, io }) {
  return async function shipUpdate(ctx) {
    const { config = {} } = ctx;
    const { ship } = config;
    if (!ship) return Promise.reject();
    try {
      await store.setup(ctx, io);
      if (store.pool(ship)) return true;
      const setupOnConnection = io.of(ship).on("connection", onConnection);
      return Promise.resolve(store.pool(ship, setupOnConnection));
    } catch (err) {
      console.log(err);
      return Promise.reject();
    }
  };
}
