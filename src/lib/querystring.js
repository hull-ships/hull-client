/* global window */

import queryString from "query-string";
import Promise from "bluebird";

export default function getQueryStringIds() {
  return new Promise(function getId(resolve /* , reject */) {
    const { location } = window;
    // https://segment.com/docs/sources/website/analytics.js/#querystring-api
    const { ajs_email: email, ajs_uid: externalId, ajs_aid: anonymousId } = (queryString.parse(location.search) || {});
    if (!externalId && !anonymousId && !email) return resolve({});
    return resolve({ anonymousId, externalId, email });
  });
}
