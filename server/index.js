import Hull from "hull";
import Server from "./server";
import { name } from "../manifest.json";

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

if (process.env.NEW_RELIC_LICENSE_KEY) {
  Hull.logger.warn("Starting newrelic agent with key: ", process.env.NEW_RELIC_LICENSE_KEY);
  require("newrelic"); // eslint-disable-line global-require
}

if (process.env.LOGSTASH_HOST && process.env.LOGSTASH_PORT) {
  const Logstash = require("winston-logstash").Logstash; // eslint-disable-line global-require
  Hull.logger.add(Logstash, {
    node_name: name,
    port: process.env.LOGSTASH_PORT || 1515,
    host: process.env.LOGSTASH_HOST
  });
  Hull.logger.info("start", { transport: "logstash" });
} else {
  Hull.logger.info("start", { transport: "console" });
}


Server({
  Hull,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  hostSecret: process.env.SECRET || "12345678902234567890",
  devMode: process.env.NODE_ENV === "development",
  port: process.env.PORT || 8082
});
