/* global window */

import isEmpty from "lodash/isEmpty";
import debugFactory from "debug";
import { Promise } from "es6-promise";
import intercom from "./intercom";

const debug = debugFactory("hull-browser");

export default function getAnalyticsId() {
  return new Promise((resolve /* , reject */) => {
    const { analytics } = window;
    if (!analytics || !analytics.user) return resolve({});
    setTimeout(() => resolve({}), 500);
    debug("fetching analytics.js identities");

    return intercom()
      .then((ids = {}) => {
        debug("inside analytics.js / Intercom's promise callback");
        const user = analytics.user();
        const externalId = user.id();
        const anonymousId = user.anonymousId();
        const { email } = user.traits();

        // Handle the async Intercom load by Segment;
        if (!isEmpty(ids)) {
          debug("analytics.js using IDs from", ids);
          return resolve(ids);
        }
        debug("found IDs from analytics.js", {
          anonymous_id: anonymousId,
          external_id: externalId,
          email
        });
        return resolve({
          anonymous_id: anonymousId,
          external_id: externalId,
          email
        });
      })
      .catch(err => {
        debug("error in analytics.js ID parsing", err);
        resolve({});
      });
  });
}
