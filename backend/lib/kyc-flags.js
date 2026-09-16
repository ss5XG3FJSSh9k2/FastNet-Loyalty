const fs = require('fs');
const path = require('path');
const db = require('../db');
const generateId = () => Math.random().toString(36).substr(2, 9);

// Verhoeff algorithm tables
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

function checkVerhoeff(num) {
  let c = 0;
  const arr = String(num).split('').reverse().map(Number);
  for (let i = 0; i < arr.length; i++) {
    c = d[c][p[i % 8][arr[i]]];
  }
  return c === 0;
}

function normalize(str) {
  return String(str || '').toLowerCase().replace(/[^\w]/g, '').replace(/(.)\1+/g, '$1');
}

let profanityList = [];
try {
  profanityList = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'profanity-words.json'), 'utf8'));
} catch (e) {
  console.warn('Could not load profanity list');
}

async function evaluateRegistrationFlags(user, clientIp, isBackfill = false) {
  const flags = [];
  const kyc = user.kyc_details || {};
  const users = await db.getTable('users');

  // Rule 1: DUPLICATE_ID (HIGH)
  const normId = String(kyc.id_number || '').replace(/\D/g, '');
  if (normId) {
    const matches = users.filter(u => {
      if (u.id === user.id) return false;
      const uKyc = u.kyc_details || {};
      const uId = String(uKyc.id_number || u.kyc_id_number || '').replace(/\D/g, '');
      return uId === normId;
    });

    if (matches.length > 0) {
      // Check hard block
      const hasActiveBlacklist = matches.some(m => m.kyc_status === 'BLACKLISTED' && m.kyc_blacklist_until && new Date(m.kyc_blacklist_until) > new Date());
      if (hasActiveBlacklist && !isBackfill) {
        throw new Error('BLACKLIST_BLOCK');
      }

      flags.push({
        id: 'f-' + generateId(),
        user_id: user.id,
        flag_type: 'DUPLICATE_ID',
        severity: 'HIGH',
        detail: `ID number matches ${matches.length} other record(s)`,
        related_user_ids: matches.map(m => m.id)
      });
    }
  }

  // Rule 2: INVALID_ID_FORMAT (HIGH)
  const normIdType = String(kyc.id_type || '').toUpperCase();
  if ((normIdType.includes('AADHAAR') || normIdType.includes('AADHAR')) && normId.length === 12) {
    const firstDigit = normId[0];
    const isChecksumValid = checkVerhoeff(normId);
    if (firstDigit === '0' || firstDigit === '1' || !isChecksumValid) {
      flags.push({
        id: 'f-' + generateId(),
        user_id: user.id,
        flag_type: 'INVALID_ID_FORMAT',
        severity: 'HIGH',
        detail: 'Invalid Aadhaar format (checksum failed or starts with 0/1)',
        related_user_ids: []
      });
    }
  }

  // Rule 3: SUSPICIOUS_PATTERN (MEDIUM)
  const isSuspiciousPattern = (val) => {
    if (!val) return false;
    const digits = val.replace(/\D/g, '');
    if (digits.length > 0) {
      const distinct = new Set(digits.split('')).size;
      if (distinct < 3) return true;
      let asc = true, desc = true;
      for (let i = 1; i < digits.length; i++) {
        if (Number(digits[i]) !== Number(digits[i-1]) + 1) asc = false;
        if (Number(digits[i]) !== Number(digits[i-1]) - 1) desc = false;
      }
      if (asc || desc) return true;
    }
    return false;
  };

  if (isSuspiciousPattern(user.phone) || isSuspiciousPattern(kyc.id_number)) {
    flags.push({
      id: 'f-' + generateId(),
      user_id: user.id,
      flag_type: 'SUSPICIOUS_PATTERN',
      severity: 'MEDIUM',
      detail: 'Phone or ID contains suspicious numeric pattern',
      related_user_ids: []
    });
  }

  // Rule 4: PROFANITY (HIGH)
  const shopName = String(kyc.shop_name || '');
  const ownerName = String(user.name || '');
  
  const hasProfanity = (text) => {
    // Normalise text for word boundaries, but also need to match against profanityList.
    // The spec says: "Match on word boundaries and normalised text (lowercase, strip punctuation and repeated characters) — not naive substring".
    const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
    return words.some(w => {
      const normW = w.replace(/(.)\1+/g, '$1');
      return profanityList.includes(w) || profanityList.includes(normW);
    });
  };

  if (hasProfanity(shopName) || hasProfanity(ownerName)) {
    flags.push({
      id: 'f-' + generateId(),
      user_id: user.id,
      flag_type: 'PROFANITY',
      severity: 'HIGH',
      detail: 'Shop or owner name contains profanity',
      related_user_ids: []
    });
  }

  // Rule 5: SUSPICIOUS_ADDRESS (MEDIUM)
  const address = String(kyc.shop_address || user.address || '');
  if (address) {
    const locWords = ['road', 'street', 'market', 'nagar', 'bazar', 'lane', 'gali', 'pur', 'para', 'more', 'mor'];
    const lowerAddr = address.toLowerCase();
    const hasDigit = /\d/.test(address);
    const hasLocWord = locWords.some(w => lowerAddr.includes(w));
    const noDigitNoLoc = !hasDigit && !hasLocWord;
    const hasConsecutiveConsonants = /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(address);
    const identicalToShop = address.trim().toLowerCase() === shopName.trim().toLowerCase();
    
    if (address.length < 10 || noDigitNoLoc || hasConsecutiveConsonants || identicalToShop) {
      flags.push({
        id: 'f-' + generateId(),
        user_id: user.id,
        flag_type: 'SUSPICIOUS_ADDRESS',
        severity: 'MEDIUM',
        detail: 'Address appears suspicious or placeholder',
        related_user_ids: []
      });
    }
  }

  // Rule 6: DUPLICATE_SHOP (MEDIUM)
  if (shopName) {
    const shopMatches = users.filter(u => {
      if (u.id === user.id) return false;
      const uKyc = u.kyc_details || {};
      const sameShop = String(uKyc.shop_name || '').trim().toLowerCase() === shopName.trim().toLowerCase();
      const sameRegion = u.region_id === user.region_id;
      const sameAddress = String(uKyc.shop_address || u.address || '').trim().toLowerCase() === address.trim().toLowerCase();
      return (sameShop && sameRegion) || sameAddress;
    });

    if (shopMatches.length > 0) {
      flags.push({
        id: 'f-' + generateId(),
        user_id: user.id,
        flag_type: 'DUPLICATE_SHOP',
        severity: 'MEDIUM',
        detail: `Shop name/address matches ${shopMatches.length} other record(s)`,
        related_user_ids: shopMatches.map(m => m.id)
      });
    }
  }

  // Rule 7: NO_DOCUMENT (MEDIUM)
  let docMissing = !kyc.document_photo_url;
  if (kyc.document_photo_url && kyc.document_photo_url.startsWith('/api/kyc/documents/')) {
    const filename = kyc.document_photo_url.split('/').pop();
    const filepath = path.join(__dirname, '..', 'uploads', 'kyc', filename);
    if (!fs.existsSync(filepath)) {
      docMissing = true;
    }
  }
  if (docMissing) {
    flags.push({
      id: 'f-' + generateId(),
      user_id: user.id,
      flag_type: 'NO_DOCUMENT',
      severity: 'MEDIUM',
      detail: 'Document photo missing from request or disk',
      related_user_ids: []
    });
  }

  // Rule 8: RAPID_REGISTRATION (LOW)
  if (!isBackfill && clientIp) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentRegs = users.filter(u => u.role === 'STOCKIST' && u.created_at >= oneHourAgo && u.registration_ip === clientIp);
    // including this user, so if recentRegs.length > 3
    if (recentRegs.length > 3) {
      flags.push({
        id: 'f-' + generateId(),
        user_id: user.id,
        flag_type: 'RAPID_REGISTRATION',
        severity: 'LOW',
        detail: `More than 3 registrations from IP ${clientIp} in the last hour`,
        related_user_ids: recentRegs.filter(u => u.id !== user.id).map(u => u.id)
      });
    }
  }

  return flags;
}

module.exports = {
  evaluateRegistrationFlags
};
