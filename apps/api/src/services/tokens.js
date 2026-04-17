const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      roles: user.roles || [],
      email: user.email,
    },
    env.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  hashToken,
  signAccessToken,
  verifyAccessToken,
};
