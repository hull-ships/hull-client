export default function statusCheckFactory({ store }) {
  const { get, pool, lru } = store;
  return async function statusCheck(req, res) {
    const { ship, client } = req.hull;
    let status = "ok";
    const messages = [];
    try {
      await get(ship.id);
    } catch (e) {
      messages.push("Connector Cache empty");
    }
    if (!pool[ship.id]) messages.push("No Connector Socket active");
    if (!lru[ship.id]) messages.push("Empty Recent user list");
    if (messages.length) status = "error";
    res.json({ status, messages });
    return client.put(`${req.hull.ship.id}/status`, { status, messages });
  };
}
