/* global window */

import Promise from "bluebird";

export default function getHullIds() {
  return new Promise(function getId(resolve /* , reject */) {
    const { Hull } = window;

    if (!Hull) return resolve({});

    return Hull.ready((hull, me = {}) => {
      const { anonymousId } = hull.config();
      const { external_id: externalId, id } = me;
      resolve({ id, externalId, anonymousId });
    });
  });
}
