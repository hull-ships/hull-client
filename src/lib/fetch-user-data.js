/* global _hullData */

import axios from "axios";

export default function fetchUserData({ endpoint, token }, { anonymousId, externalId, email, id }) {
  if (!id && !anonymousId && !externalId && !email) return null;
  return axios
  .get(endpoint, {
    params: { token, anonymousId, externalId, email, id }
  })
  .then((res) => {
    if (res && res.status === 200) return res.data;
    return {};
  });
}
