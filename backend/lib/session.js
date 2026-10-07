const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

let MEMORY_SECRET = null;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (MEMORY_SECRET) return MEMORY_SECRET;
    
    const secretPath = path.join(__dirname, '../data/dev-jwt-secret');
    if (fs.existsSync(secretPath)) {
      MEMORY_SECRET = fs.readFileSync(secretPath, 'utf8').trim();
    } else {
      MEMORY_SECRET = `dev_secret_${Math.random().toString(36).substring(2)}_${Date.now()}`;
      try {
        fs.writeFileSync(secretPath, MEMORY_SECRET, 'utf8');
      } catch (e) {
        // ignore if can't write, will just use memory
      }
    }
    return MEMORY_SECRET;
  }
  return secret;
}

function signSession(userId, role) {
  const secret = getSecret();
  // Sessions last 7 days. jsonwebtoken automatically sets iat and exp.
  // Payload: { sub: userId, role }
  return jwt.sign({ sub: userId, role }, secret, { expiresIn: '7d' });
}

function verifySession(token) {
  const secret = getSecret();
  const decoded = jwt.verify(token, secret);
  return {
    userId: decoded.sub || decoded.user_id,
    role: decoded.role
  };
}

module.exports = {
  signSession,
  verifySession,
  getSecret
};
