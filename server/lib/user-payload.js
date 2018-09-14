import _ from "lodash";

/**
 * Build a User payload with the necessary objects to be sent client-side
 * @param  {Object} options.user     User attributes, Received from `user:update`
 * @param  {Object} options.segments User segments, Received from `user:update`
 * @param  {Object} options.client   Hull Client, scoped to current ship
 * @param  {Object} options.ship     Ship settings
 * @return {Object}                  The user payload, status code, and script to run client-side
 */
export default function userPayload({
  user = {},
  segments = [],
  events,
  account = {},
  client,
  ship = {}
}) {
  const { private_settings = {}, settings = {} } = ship;

  const {
    public_traits = [],
    public_events = [],
    public_segments = [],
    public_account_segments = [],
    synchronized_segments = []
  } = private_settings;

  const segmentIds = _.map(segments, "id");

  // No Segment: Everyone goes there
  if (synchronized_segments.length && !_.intersection(synchronized_segments, segmentIds).length) {
    return { message: "private", user: { id: user.id }, segments: {} };
  }

  const u = client.utils.groupTraits(_.pick(_.omit(user, "segments"), public_traits));
  return {
    message: "ok",
    script: settings.script,
    user: { ...u, id: user.id },
    // workaround to use the traits that contain both account and user traits, and leave the account object separate
    account: _.pick({ account }, _.filter(public_traits, t => t.indexOf("account.") === 0)).account,
    events: _.map(_.filter(events, e => _.includes(public_events, e.event)), "event"),
    segments: _.map(_.filter(segments, s => _.includes(public_segments, s.id)), "name"),
    account_segments: _.map(_.filter(segments, s => _.includes(public_account_segments, s.id)), "name")
  };
}
