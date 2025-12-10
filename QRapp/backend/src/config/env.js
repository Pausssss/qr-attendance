require('dotenv').config();

const rawOrigins = process.env.CORS_ORIGIN || '';
const CORS_ORIGIN = rawOrigins
  ? rawOrigins.split(',').map((o) => o.trim())
  : ['http://localhost:5173']; // default dev

module.exports = {
  PORT: process.env.PORT || 4000,

  // Ưu tiên biến của Railway nếu có (MYSQLHOST, MYSQLUSER, ...)
  DB_HOST: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  DB_USER: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  DB_NAME: process.env.DB_NAME || process.env.MYSQLDATABASE || 'qr_attendance',
  DB_PORT: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),

  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwt',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

  ATTENDANCE_ON_TIME_MINUTES: parseInt(
    process.env.ATTENDANCE_ON_TIME_MINUTES || '15',
    10
  ),

  CORS_ORIGIN,
};
