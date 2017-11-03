import bluebird from "bluebird";
import Redis from "redis";
import express from "express";
import { Cache } from "hull/lib/infra";
import { smartNotifierHandler } from "hull/lib/utils";
import { devMode, errorHandler } from "hull-connector";
import SocketIO from "socket.io";
import socketIOredis from "socket.io-redis";
import socketFactory from "./lib/socket-factory";
import sendPayloadFactory from "./lib/send-payload";

import {
  statusHandlerFactory,
  userUpdateFactory,
  shipUpdateFactory
} from "./handlers";
import Store from "./lib/store";

export default function Server(options = {}) {
  const { hostSecret, Hull, redisUri } = options;

  bluebird.promisifyAll(Redis.RedisClient.prototype);
  bluebird.promisifyAll(Redis.Multi.prototype);

  const app = express();

  if (options.devMode) devMode(app, options);

  // Setup Hull express connector;
  const connector = new Hull.Connector(options);
  connector.setupApp(app);

  const cacheMiddleware = new Cache().contextMiddleware();
  const hullMiddleware = Hull.Middleware({ hostSecret, fetchShip: true });
  const hullWrapper = (req = {}, res = {}, cb) => {
    cacheMiddleware(req, res, () => {
      hullMiddleware(req, res, () => cb(req, res));
    });
  };

  const redis = Redis.createClient(redisUri);
  const store = Store(redis);
  const io = SocketIO(connector.startApp(app)).adapter(socketIOredis(redisUri));
  const sendPayload = sendPayloadFactory({ io });
  const onConnection = socketFactory({ Hull, store, sendPayload });

  const userUpdate = userUpdateFactory({ sendPayload, store });
  const shipUpdate = shipUpdateFactory({ store, onConnection, io });

  // Setup Auth for the Admin page
  app.get("/admin.html", hullMiddleware, (req, res) => {
    const { config } = req.hull;
    const { ship: id } = config;
    res.render("admin.html", { id, host: req.hostname });
  });

  // Reply to Notifications
  app.post(
    "/smart-notifier",
    smartNotifierHandler({
      hostSecret,
      groupTraits: true,
      onError: (message, status) => console.warn("Error", status, message),
      handlers: {
        "user:update": (ctx, messages) => {
          shipUpdate(ctx);
          messages.map(message => userUpdate(ctx, message));
          // Get 100 users every 100ms at most.
          const { smartNotifierResponse } = ctx;
          smartNotifierResponse.setFlowControl({ type: "next", size: 100, in: 100 });
          return Promise.resolve();
        },
        "ship:update": shipUpdate,
        "segment:update": shipUpdate
      }
    })
  );
  app.all("/status", statusHandlerFactory({ store }));

  // Error Handler
  app.use(errorHandler);

  return app;
}
