import _ from "lodash";

export default function getRooms(user) {
  if (!user || !_.size(user)) return [];
  return _.filter(
    [
      ...(user.anonymous_ids || []),
      user.external_id,
      user.id,
      user.email,
      user.contact_email
    ],
    i => !!i
  );
}
