/* global window */

import get from "lodash/get";


export default function({ emitter, debug, response, changes }) {
  if (get(response, "user.id")) {
    const {
      user = {},
      events = [],
      account = {},
      segments = [],
      account_segments = [],
      script
    } = response;
    const update = {
      user,
      events,
      account,
      segments,
      changes,
      account_segments
    }
    debug("emitting user.update",update);
    emitter.emit("user.update", update);
    eval(`!(function(user, segments, account, account_segments, events, changes){ ${script} })(${JSON.stringify(user)}, ${JSON.stringify(segments)}, ${JSON.stringify(account)}, ${JSON.stringify(account_segments)}, ${JSON.stringify(events)}, ${JSON.stringify(changes)})`);
  }
}
