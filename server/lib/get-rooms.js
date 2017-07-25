import { size } from "lodash";

export default function getRooms(user) {
  if (!user || !size(user)) return [];
  return [
    ...(user.anonymous_ids || []),
    user.external_id,
    user.id,
    user.email,
    user.contact_email
  ];
}
