/* global window */
export default function ({ response }) {
  if (response && response.user && response.user.id) {
    // Enable cached lookup for subsequent page;

    window.localStorage.setItem("hull_id", response.user.id);
    // emitter.emit("user.update", response);
    const { user = {}, events = [], account = {}, segments, script } = response;

    eval(`!(function(user, segments, account, events){ ${script} })(${JSON.stringify(user)}, ${JSON.stringify(segments)}, ${JSON.stringify(account)}, ${JSON.stringify(events)})`);

    // emitter.emit("user.update", { user, segments });
  }
}
