/* global _hull, window, analytics, location */

import Promise from "bluebird";
import { find, isEmpty } from "lodash";
import { EventEmitter2 } from "eventemitter2";
import getQueryStringIds from "./lib/querystring";
import getAnalyticsIds from "./lib/analytics";
import getHullIds from "./lib/hull";
import fetchUserData from "./lib/fetch-user-data";


(function Emitter() {
  if (!_hull) {
    console.warn("No _hull object found. Needed to move forward");
    return Promise.reject();
  }

  const findId = (ids = []) => find(ids, id => !isEmpty(id));

  const emitter = new EventEmitter2({
    wildcard: true,
    delimiter: ".",
    maxListeners: 20,
  });

  const { endpoint, token } = _hull;

  function setup() {
    return Promise.all([
      getQueryStringIds(),
      getAnalyticsIds(),
      getHullIds()
    ])
    .then(ids => findId(ids))
    .then((hash = {}) => fetchUserData({ endpoint, token }, hash))
    .then(user => emitter.emit("user.update", user));
  }

  setup();

  _hull.emitter = emitter;
  return emitter;
})();
