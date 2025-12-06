const pool = require('../config/db');

const SessionModel = {
  async createSession({ classId, title, sessionDate }) {
    const [result] = await pool.query(
      `INSERT INTO Sessions (classId, title, sessionDate, status, createdAt)
       VALUES (?,?,?, 'CLOSED', NOW())`,
      [classId, title, sessionDate]
    );
    const [rows] = await pool.query('SELECT * FROM Sessions WHERE id = ?', [
      result.insertId,
    ]);
    return rows[0];
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM Sessions WHERE id = ?', [
      id,
    ]);
    return rows[0] || null;
  },

  async getSessionsByClass(classId) {
    const [rows] = await pool.query(
      'SELECT * FROM Sessions WHERE classId = ? ORDER BY sessionDate DESC',
      [classId]
    );
    return rows;
  },

  // Lưu QR token + thời gian hết hạn + vị trí GPS của giáo viên
  async openSession(id, qrToken, qrTokenExpiresAt, teacherLat, teacherLng) {
    await pool.query(
      `UPDATE Sessions
       SET status = 'OPEN',
           qrToken = ?,
           qrTokenExpiresAt = ?,
           teacherLat = ?,
           teacherLng = ?
       WHERE id = ?`,
      [qrToken, qrTokenExpiresAt, teacherLat, teacherLng, id]
    );
  },

  async closeSession(id) {
    await pool.query(
      `UPDATE Sessions
       SET status = 'CLOSED',
           qrToken = NULL,
           qrTokenExpiresAt = NULL
       WHERE id = ?`,
      [id]
    );
  },

  async getSessionsByClassIds(classIds) {
    if (!classIds || !classIds.length) return [];
    const placeholders = classIds.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT * FROM Sessions WHERE classId IN (${placeholders})`,
      classIds
    );
    return rows;
  },
};

module.exports = SessionModel;
