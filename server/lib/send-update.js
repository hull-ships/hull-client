import { map } from "lodash";

export default function sendUpdateFactory({ io }) {
  return ({ ship, user, update }) => {
    // Send the update to every identifiable id for this user.
    const ids = user ? [...(user.anonymous_ids || []), user.external_id, user.id] : { id: update.user.id };
    map(ids, (id) => {
      if (!id) return true;
      return io
        .of(ship.id)
        .in(id)
        .emit("user.update", update);
    });
  };
}
