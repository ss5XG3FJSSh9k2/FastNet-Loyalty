const crypto = require('crypto');

let fallbackKey = null;
function getEncryptionKey() {
  if (process.env.DATA_ENCRYPTION_KEY) {
    let keyHex = process.env.DATA_ENCRYPTION_KEY.trim();
    if (keyHex.length < 64) {
      keyHex = crypto.createHash('sha256').update(keyHex).digest('hex');
    }
    return Buffer.from(keyHex.substring(0, 64), 'hex');
  }
  if (!fallbackKey) {
    fallbackKey = crypto.randomBytes(32);
  }
  return fallbackKey;
}

function encryptData(plaintext) {
  if (!plaintext && plaintext !== 0) return plaintext;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

function decryptData(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.includes(':')) {
    return ciphertext;
  }
  const parts = ciphertext.split(':');
  if (parts.length !== 3) return ciphertext;
  const [ivHex, tagHex, encryptedHex] = parts;
  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return ciphertext;
  }
}

module.exports = {
  encryptData,
  decryptData
};
