/* global window, analytics, location, document */

import { Promise } from "es6-promise";
import find from "lodash/find";
import isEmpty from "lodash/isEmpty";
import io from "socket.io-client";
import getLocalStorage from "./lib/localstorage";
import getQueryStringIds from "./lib/querystring";
import getAnalyticsIds from "./lib/analytics";
import getHullIds from "./lib/hull";
import getIntercomIds from "./lib/intercom";
import userUpdate from "./lib/user-update";


const onEmbed = (rootNode, deployment, hull) => {
  const scriptTag = document.querySelector("script[data-hull-endpoint]");
  let id;
  let endpoint;
  if (scriptTag) {
    id = scriptTag.getAttribute("data-hull-id");
    endpoint = scriptTag.getAttribute("data-hull-endpoint");
  } else if (hull && deployment) {
    const { ship /* , platform */ } = deployment;
    // const { id: platformId } = platform;
    id = ship.id;
    endpoint = ship.source_url;
  }

  if (!id || !endpoint) {
    console.log("Could not find id or Endpoint on the Script tag. Did you copy/paste it correctly?");
  }

  const findId = (ids = []) => find(ids, idGroup => !isEmpty(idGroup));

  const socket = io(`${endpoint}/${id}`);

  function setup() {
    const search = hull
      ? Promise.all([getHullIds()])
      : Promise.all([getLocalStorage(), getQueryStringIds(), getIntercomIds(), getHullIds(), getAnalyticsIds()]);

    search.then((ids) => {
      const found = findId(ids);
      if (!isEmpty(found)) return found;
      setTimeout(setup, 500);
      return null;
    },
      err => console.log(err)
    )
    .then((query = {}) => {
      if (!query) return null;
      socket.emit("user.fetch", { id, query });
      return true;
    },
      err => console.log(err)
    );
  }

  setup();
  socket.on("user.update", (response = {}) => userUpdate({ response }));
  socket.on("room.joined", (res) => { console.log("joined Room", res); });
  socket.on("room.error", (res) => { console.log("error", res); });
  socket.on("close", ({ message }) => { console.log(message); });
};

if (window.Hull && window.Hull.onEmbed) {
  window.Hull.onEmbed(onEmbed);
} else {
  onEmbed();
}
