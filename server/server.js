import express from "express";
import path from "path";
import { renderFile } from "ejs";
import cors from "cors";
import corsDelegate from "./lib/cors-delegate";
import tokenOps from "./lib/token";
import handleUser from "./handle-user";
import DevMode from "./dev-mode";

module.exports = function Server(options = {}) {
  const { devMode, port, hostSecret, Hull } = options;
  const { NotifHandler, Routes, Middleware } = Hull;
  const { Readme, Manifest } = Routes;

  const app = express();

  if (devMode) app.use(DevMode());

  app.set("views", `${__dirname}/../views`);
  app.set("view engine", "ejs");
  app.engine("html", renderFile);
  app.use(express.static(path.resolve(__dirname, "..", "dist")));
  app.use(express.static(path.resolve(__dirname, "..", "assets")));

  app.get("/manifest.json", Manifest(__dirname));
  app.get("/", Readme);
  app.get("/readme", Readme);

  app.post("/notify", NotifHandler({
    hostSecret,
    groupTraits: true,
    onError: (message, status) => console.warn("Error", status, message),
    handlers: {
      "user:update": function userUpdate() {},
      "segment:update": function segmentUpdate() {}
    }
  }));

  const { encrypt, parse } = tokenOps({ hostSecret });

  const hullClient = Middleware({ hostSecret, fetchShip: true });

  app.get("/admin.html", hullClient, (req, res) => {
    const { config } = req.hull;
    res.render("admin.html", { token: encrypt(config), host: req.hostname });
  });

  app.get("/user", parse, hullClient, cors(corsDelegate), handleUser);

  Hull.logger.info("started", { port });
  app.listen(port);
  return app;
};
