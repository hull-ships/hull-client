export default function shipUpdateFactory({ store, Sockets, onConnection, io }) {
  return function shipUpdate(ctx) {
    const { config = {} } = ctx;
    const { ship: id } = config;
    if (!id) return;
    store
      .setup(ctx)
      .then(() => {
        if (!Sockets[id]) Sockets[id] = io.of(id).on("connection", onConnection);
      });
  };
}
