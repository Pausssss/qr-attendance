// File: backend/src/utils/randomToken.js
const crypto = require('crypto');

// Sinh token random dùng cho QR
function generateRandomToken(length = 16) {
  // length tính theo bytes, chuỗi hex ra sẽ dài gấp đôi
  return crypto.randomBytes(length).toString('hex');
}

module.exports = { generateRandomToken };
