export default function ({ response }) {
  if (response && response.user && response.user.id) {
    // Enable cached lookup for subsequent page;

    window.localStorage.setItem("hull_id", response.user.id);
    // emitter.emit("user.update", response);
    const { user, segments, script } = response;

    eval(`!(function(user, segments){ ${script} })(${JSON.stringify(user)}, ${JSON.stringify(segments)})`);

    // emitter.emit("user.update", { user, segments });
  }
}
