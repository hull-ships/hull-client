import _ from "lodash";

export default function ({ user, segments, client, ship = {} }) {
  const { private_settings, settings } = ship;

  const {
    public_traits = [],
    public_segments = [],
    synchronized_segments = []
  } = private_settings;


  const segmentIds = _.map(user.segments || segments, "id");

  if (!synchronized_segments.length || !_.intersection(synchronized_segments, segmentIds).length) {
    return {
      message: "private",
      user: {},
      segments: {}
    };
  }

  const u = client
  .utils
  .groupTraits(_.pick(_.omit(user, "segments"), public_traits));
  return {
    message: "ok",
    user: { ...u, id: user.id },
    script: settings.script,
    segments: _.map(_.filter((user.segments || segments), s => _.includes(public_segments, s.id)), "name")
  };
}
