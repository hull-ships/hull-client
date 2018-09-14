/* global window, analytics, location, document */

import { Promise } from "es6-promise";
import find from "lodash/find";
import isEmpty from "lodash/isEmpty";
import get from "lodash/get";
import io from "socket.io-client";
import debugFactory from "debug";
import { setLocalStorage, getLocalStorageId, getLocalStorage, deleteLocalStorage } from "./lib/localstorage";
import getQueryStringIds from "./lib/querystring";
import getAnalyticsIds from "./lib/analytics";
import getHullIds from "./lib/hull";
import getIntercomIds from "./lib/intercom";
import userUpdate from "./lib/user-update";
import diff from "./lib/diff";
import { EventEmitter2 as EventEmitter } from "eventemitter2";

const onEmbed = (rootNode, deployment, hull) => {
  const debug = debugFactory('hull-browser');
  const scriptTag = document.querySelector("script[data-hull-endpoint]");
  let shipId;
  let platformId;
  let endpoint;
  if (hull && deployment) {
    const { ship, platform } = deployment;
    platformId = platform.id;
    shipId = ship.id;
    endpoint = `${ship.source_url.replace(/\/$/, "")}`;
  } else if (scriptTag) {
    shipId = scriptTag.getAttribute("data-hull-id");
    endpoint = scriptTag.getAttribute("data-hull-endpoint");
  }

  if (!shipId || !endpoint) {
    return console.log("Could not find ID or Endpoint on the Script tag. Did you copy/paste it correctly?");
  }

  const findId = (ids = []) => find(ids, idGroup => !isEmpty(idGroup));
  debug("Creating socket on", `${endpoint}/${shipId}`);
  const socket = io(`${endpoint}/${shipId}`, { transports: ['websocket'] });
  const emitter = window.Hull && window.Hull.emit ? window.Hull : new EventEmitter({
    wildcard: true,
    verboseMemoryLeak: true
  });

  if (!window.Hull) window.hullBrowser = emitter;

  function setup() {
    const search = hull
      ? Promise.all([getHullIds()])
      : Promise.all([getLocalStorageId(), getQueryStringIds(), getIntercomIds(), getHullIds(), getAnalyticsIds()]);

    search.then((ids) => {
      const found = findId(ids);
      if (!isEmpty(found)) return found;
      setTimeout(setup, 500);
      return null;
    },
      err => debug(err)
    )
    .then((claims = {}) => {
      if (!claims) return null;
      debug("Establishing connection with settings", { shipId, platformId, claims });
      socket.emit("user.fetch", { shipId, platformId, claims });
      return true;
    },
      err => debug(err)
    );
  }

  // Emit a first event on boot.
  getLocalStorage().then(response => userUpdate({ emitter, debug, response, boot: true }));

  setup();

  socket.on("user.update", async (response = {}) => {
    const userId = get(response, "user.id");
    const previous = await getLocalStorage() || {};
    const changes = diff(response, previous);
    if (!_.isEmpty(changes)) {
      debug("user.update CHANGE", changes);
      if (userId) setLocalStorage(response);
      userUpdate({ emitter, debug, response, changes });
    }
  });
  socket.on("room.joined", (res) => { debug("room.joined", res); });
  socket.on("room.error", (res) => { debug("error", res); });
  socket.on("close", ({ message }) => { debug("close", message); });
};

if (window.Hull && window.Hull.onEmbed) {
  window.Hull.onEmbed(onEmbed);
} else {
  onEmbed();
}
