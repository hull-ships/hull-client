import _ from "lodash";
import Lru from "redis-lru";

export default function Store(redis) {
  const LRU = {};

  const get = shipId => redis.getAsync(shipId).then(res => JSON.parse(res), function getError(err) { throw err; });
  const set = (shipId, value) => redis.setAsync(shipId, JSON.stringify(value));

  const lru = (id) => {
    if (LRU[id]) return LRU[id];
    const l = Lru(redis, { max: 1000, maxAge: 150000, namespace: id });
    LRU[id] = l;
    return l;
  };


  const setup = (ctx = {}) => {
    if (_.size(ctx)) {
      // Cache the current config.
      const { config, ship } = ctx;
      if (!config || !ship) return Promise.reject(new Error("No config in Context object"));

      const { ship: id } = config;
      const { private_settings } = ship;
      if (!private_settings) return Promise.reject(new Error("No private_settings"));

      lru(id);
      return set(id, { ship: { id, private_settings }, config });
    }
    return Promise.reject(new Error("No context object"));
  };
  return { get, set, setup, lru };
}