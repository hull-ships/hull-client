/* global window, analytics, location, document */

import { Promise } from "es6-promise";
import find from "lodash/find";
import isEmpty from "lodash/isEmpty";
import get from "lodash/get";
import io from "socket.io-client";
import { setLocalStorage, getLocalStorageId, getLocalStorage, deleteLocalStorage } from "./lib/localstorage";
import getQueryStringIds from "./lib/querystring";
import getAnalyticsIds from "./lib/analytics";
import getHullIds from "./lib/hull";
import getIntercomIds from "./lib/intercom";
import userUpdate from "./lib/user-update";


const onEmbed = (rootNode, deployment, hull) => {
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

  console.log(shipId, platformId);

  if (!shipId || !endpoint) {
    debugger
    return console.log("Could not find ID or Endpoint on the Script tag. Did you copy/paste it correctly?");
  }

  const findId = (ids = []) => find(ids, idGroup => !isEmpty(idGroup));

  const socket = io(`${endpoint}/${shipId}`);

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
      err => console.log(err)
    )
    .then((claims = {}) => {
      if (!claims) return null;
      console.log("user.fetch", { shipId, platformId, claims });
      socket.emit("user.fetch", { shipId, claims });
      return true;
    },
      err => console.log(err)
    );
  }

  getLocalStorage().then(response => userUpdate({ response }));

  setup();

  socket.on("user.update", (response = {}) => {
    const userId = get(response, "user.id");
    if (userId) setLocalStorage(response);
    userUpdate({ response });
  });
  socket.on("room.joined", (res) => { console.log("room.joined", res); });
  socket.on("room.error", (res) => { console.log("error", res); });
  socket.on("close", ({ message }) => { console.log(message); });
};

if (window.Hull && window.Hull.onEmbed) {
  window.Hull.onEmbed(onEmbed);
} else {
  onEmbed();
}
