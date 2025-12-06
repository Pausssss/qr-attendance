// File: backend/src/middleware/auth.js
const { verifyJwt } = require('../utils/jwt');

function auth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = verifyJwt(token);
    req.user = {
      id: payload.id,
      role: payload.role,
      fullName: payload.fullName,
      email: payload.email,
    };
    next();
  } catch (err) {
    console.error('JWT verify error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = auth;
