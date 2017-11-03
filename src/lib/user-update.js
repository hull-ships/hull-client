/* global window */
import get from "lodash/get";

export default function ({ response }) {
  if (get(response, "user.id")) {
    const { user = {}, events = [], account = {}, segments, script } = response;
    console.log('hull user update', response);
    eval(`!(function(user, segments, account, events){ ${script} })(${JSON.stringify(user)}, ${JSON.stringify(segments)}, ${JSON.stringify(account)}, ${JSON.stringify(events)})`);
  }
}
