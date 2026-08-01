const jwt = require('jsonwebtoken');

const FALLBACK_SECRET = `fallback_secret_${Math.random().toString(36).substring(2)}_${Date.now()}`;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[Session] Warning: JWT_SECRET environment variable is missing. Using static-but-random-per-process fallback.');
    return FALLBACK_SECRET;
  }
  return secret;
}

function signSession(userId, role) {
  const secret = getSecret();
  // sign with 24h expiration. jsonwebtoken automatically sets iat and exp.
  // Payload: { sub: userId, role }
  return jwt.sign({ sub: userId, role }, secret, { expiresIn: '24h' });
}

function verifySession(token) {
  const secret = getSecret();
  const decoded = jwt.verify(token, secret);
  return {
    userId: decoded.sub,
    role: decoded.role
  };
}

module.exports = {
  signSession,
  verifySession
};
