import Hull from "hull";
import Server from "./server";
import { name } from "../manifest.json";

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

Server({
  Hull,
  redisUri: process.env.REDIS_URL || "//localhost:6379",
  hostSecret: process.env.SECRET || "12345678902234567890",
  devMode: process.env.NODE_ENV === "development",
  port: process.env.PORT || 8082
});
