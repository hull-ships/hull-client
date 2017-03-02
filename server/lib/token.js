import crypto from "crypto";
import jwt from "jwt-simple";

const algorithm = "aes-256-ctr";

export default function buildTokenFactory({ hostSecret }) {
  function encrypt(text) {
    const cipher = crypto.createCipher(algorithm, hostSecret);
    const crypted = cipher.update(jwt.encode(text, hostSecret), "utf8", "hex");
    return crypted + cipher.final("hex");
  }

  function decrypt(text) {
    const decipher = crypto.createDecipher(algorithm, hostSecret);
    const dec = decipher.update(text, "hex", "utf8");
    return jwt.decode(dec + decipher.final("utf8"), hostSecret);
  }

  const parse = function parse(req, res, next) {
    req.hull = req.hull || {};
    const token = req.query.token;
    if (!token) return res.sendStatus(400);
    req.hull.config = decrypt(token);
    return next();
  };

  return { encrypt, decrypt, parse };
}
