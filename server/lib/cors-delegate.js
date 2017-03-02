import URI from "urijs";
import _ from "lodash";

export default function corsOptionsDelegate(req, callback) {
  const { hull = {} } = req;
  const { ship = {} } = hull;
  const { private_settings = {} } = ship;
  const { whitelisted_domains = [] } = private_settings;
  const corsOptions = {};
  const origin = req.header("Origin") || "";
  if (_.includes(whitelisted_domains, URI(origin).host())) {
    corsOptions.origin = true; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions.origin = false; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
}
