import bluebird from "bluebird";
import Redis from "redis";
import express from "express";
import { Cache } from "hull/lib/infra";
import { notifHandler } from "hull/lib/utils";
import Store from "./lib/store";
import DevMode from "./dev-mode";
import Socket from "./lib/socket";
import userUpdateFactory from "./lib/user-update";
import shipUpdateFactory from "./lib/ship-update";

module.exports = function Server(options = {}) {
  const { devMode, port, hostSecret, Hull, redisUri } = options;
  const { Middleware } = Hull;

  const app = express();
  const connector = new Hull.Connector({ port, hostSecret, segmentFilterSetting: "synchronized_segments" });
  connector.setupApp(app);

  if (devMode) app.use(DevMode());

  const hullClient = Middleware({ hostSecret, fetchShip: true });
  const cacheMiddleware = new Cache().contextMiddleware();
  const hullWrapper = (req = {}, res = {}, callback) =>
    cacheMiddleware(req, res, () =>
      hullClient(req, res, () => callback(req, res)
    )
  );

  bluebird.promisifyAll(Redis.RedisClient.prototype);
  bluebird.promisifyAll(Redis.Multi.prototype);

  const redis = Redis.createClient(redisUri);
  const store = Store(redis);

  const Sockets = {};

  const { sendUpdate, onConnection, io } = Socket({
    redisUri,
    store,
    Hull,
    hullWrapper,
    app: connector.startApp(app)
  });

  const shipUpdate = shipUpdateFactory({ store, Sockets, onConnection, io });
  const userUpdate = userUpdateFactory({ sendUpdate, store });

  app.post("/notify", notifHandler({
    hostSecret,
    groupTraits: true,
    onError: (message, status) => console.warn("Error", status, message),
    handlers: {
      "user:update": (ctx, messages) => {
        shipUpdate(ctx);
        messages.map(message => userUpdate(ctx, message));
      },
      "ship:update": shipUpdate,
      "segment:update": shipUpdate
    }
  }));

  app.get("/admin.html", hullClient, (req, res) => {
    const { config } = req.hull;
    const { ship: id } = config;
    res.render("admin.html", { id, host: req.hostname });
  });


  Hull.logger.info("started", { port });

  return app;
};
