import SocketIO from "socket.io";
import socketIOredis from "socket.io-redis";
import socketFactory from "./socket-factory";
import sendUpdateFactory from "./send-update";

export default function Socket({ app, Hull, redisUri, store }) {
  const io = SocketIO(app).adapter(socketIOredis(redisUri));
  const sendUpdate = sendUpdateFactory({ io });
  const onConnection = socketFactory({ Hull, store, sendUpdate });
  return { sendUpdate, onConnection, io };
}
