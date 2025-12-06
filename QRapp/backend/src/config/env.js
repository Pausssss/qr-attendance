require('dotenv').config();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

module.exports = {
  PORT: process.env.PORT || 4000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'qr_attendance',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwt',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  ATTENDANCE_ON_TIME_MINUTES: parseInt(
    process.env.ATTENDANCE_ON_TIME_MINUTES || '15',
    10
  ),
  CORS_ORIGIN,
};
