import _ from "lodash";
import getRooms from "./get-rooms";
import userPayload from "./user-payload";

export default function sendUpdateFactory({ io }) {
  return function sendPayload({ client, ship, user, account, segments }) {
    const rooms = getRooms(user);
    const payload = userPayload({
      user,
      segments,
      account,
      ship,
      client
    });

    client.logger.info("outgoing.user.start", { rooms, payload });

    if (payload.message !== "ok") {
      return client.logger.info("outgoing.user.skip", { rooms, payload });
    }

    if (!_.size(rooms)) {
      return client.logger.info("outgoing.user.error", { message: "no rooms" });
    }

    // Send the update to every identifiable id for this user.
    client.logger.info("outgoing.user.send", { ship: ship.id, payload, rooms });
    _.map(rooms, id => io.of(ship.id).in(id).emit("user.update", payload));
    return client.logger.info("outgoing.user.success", { rooms, payload });
  };
}
