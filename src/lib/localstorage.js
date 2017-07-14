/* global window */

import { Promise } from "es6-promise";

export default function getQueryStringIds() {
  return new Promise(function getId(resolve) {
    if (typeof(Storage) !== "undefined") {
      const id = window.localStorage.getItem("hull_id");
      if (!id) return resolve({});
      return resolve({ id });
    }
    return resolve({});
  });
}
