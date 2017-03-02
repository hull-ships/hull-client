/* global window */

import Promise from "bluebird";

export default function getAnalyticsId() {
  return new Promise(function getId(resolve /* , reject */) {
    const { analytics } = window;

    if (!analytics) return resolve({});

    return analytics.ready(() => {
      const user = analytics.user();
      const externalId = user.id();
      const anonymousId = user.anonymousId();
      resolve({ anonymousId, externalId });
    });
  });
}
