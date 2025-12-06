// File: backend/src/utils/jwt.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

function signJwt(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signJwt,
  verifyJwt,
};
