import _ from "lodash";

export default function handleUser(req, res) {
  const { hull, query = {} } = req;
  const { client, ship } = hull;
  const { private_settings } = ship;
  const {
    public_traits = [],
    public_segments = [],
    synchronized_segments = []
  } = private_settings;
  const { anonymousId, externalId, id, email } = query;

  if (!anonymousId && !externalId && !email) {
    return res.send("Need AnonymousId or User ID or Email");
  }

  return client
  .as({
    guest_id: anonymousId,
    external_id: externalId,
    id,
    email
  })
  .get("/me/user_report")
  .then((user = {}) => {
    const segmentIds = _.map(user.segments, "id");

    if (!synchronized_segments.length || !_.intersection(synchronized_segments, segmentIds).length) {
      return res.send({
        message: "private",
        user: {},
        segments: {}
      });
    }

    const u = client
      .utils
      .groupTraits(_.pick(_.omit(user, "segments"), public_traits));
    return res.send({
      message: "ok",
      user: u,
      segments: _.map(_.filter(user.segments, s => _.includes(public_segments, s.id)), "name")
    });
  }, (err) => {
    client.logger.error(err);
    return res.send({
      message: "not_found",
      user: {},
      segments: {}
    });
  });
}
