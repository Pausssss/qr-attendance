// File: backend/src/models/classModel.js
const pool = require('../config/db');

const ClassModel = {
  async createClass({ className, code, teacherId }) {
    const [result] = await pool.query(
      'INSERT INTO Classes (className, code, teacherId, createdAt) VALUES (?,?,?,NOW())',
      [className, code, teacherId]
    );
    return { id: result.insertId, className, code, teacherId };
  },

  async getByTeacher(teacherId) {
    const [rows] = await pool.query(
      'SELECT * FROM Classes WHERE teacherId = ? ORDER BY createdAt DESC',
      [teacherId]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM Classes WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async updateClass(id, teacherId, { className }) {
    await pool.query(
      'UPDATE Classes SET className = ? WHERE id = ? AND teacherId = ?',
      [className, id, teacherId]
    );
    return this.getById(id);
  },

  async deleteClass(id, teacherId) {
    await pool.query('DELETE FROM Classes WHERE id = ? AND teacherId = ?', [
      id,
      teacherId,
    ]);
  },

  async findByCode(code) {
    const [rows] = await pool.query('SELECT * FROM Classes WHERE code = ?', [
      code,
    ]);
    return rows[0] || null;
  },
};

module.exports = ClassModel;
