import { map } from "lodash";

export default function sendUpdateFactory({ io }) {
  return ({ ship, update, rooms = [] }) => {
    // Send the update to every identifiable id for this user.
    map(rooms, (id) => {
      if (!id) return true;
      return io
        .of(ship.id)
        .in(id)
        .emit("user.update", update);
    });
  };
}
