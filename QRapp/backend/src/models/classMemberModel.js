// File: backend/src/models/classMemberModel.js
const pool = require('../config/db');

const ClassMemberModel = {
  async addStudentToClass({ classId, studentId }) {
    try {
      const [result] = await pool.query(
        `INSERT INTO ClassMembers (classId, studentId, joinedAt)
         VALUES (?,?,NOW())`,
        [classId, studentId]
      );
      const [rows] = await pool.query(
        'SELECT * FROM ClassMembers WHERE id = ?',
        [result.insertId]
      );
      return rows[0];
    } catch (err) {
      // Nếu đã tồn tại (UNIQUE uq_class_student), trả về record hiện có
      if (err.code === 'ER_DUP_ENTRY') {
        const [rows] = await pool.query(
          'SELECT * FROM ClassMembers WHERE classId = ? AND studentId = ?',
          [classId, studentId]
        );
        return rows[0];
      }
      throw err;
    }
  },

  async getClassesByStudent(studentId) {
    const [rows] = await pool.query(
      `SELECT c.*, cm.joinedAt
       FROM ClassMembers cm
       JOIN Classes c ON cm.classId = c.id
       WHERE cm.studentId = ?
       ORDER BY c.createdAt DESC`,
      [studentId]
    );
    return rows;
  },

  async isStudentInClass(classId, studentId) {
    const [rows] = await pool.query(
      'SELECT 1 FROM ClassMembers WHERE classId = ? AND studentId = ?',
      [classId, studentId]
    );
    return rows.length > 0;
  },

  // Dùng cho màn quản lý thành viên lớp
  async getMembersByClass(classId) {
    const [rows] = await pool.query(
      `SELECT cm.*, u.fullName, u.email
       FROM ClassMembers cm
       JOIN Users u ON cm.studentId = u.id
       WHERE cm.classId = ?
       ORDER BY cm.joinedAt ASC`,
      [classId]
    );
    return rows;
  },

  // Dùng cho báo cáo (chỉ cần danh sách studentId + info)
  async getStudentsByClass(classId) {
    const [rows] = await pool.query(
      `SELECT cm.studentId, u.fullName, u.email
       FROM ClassMembers cm
       JOIN Users u ON cm.studentId = u.id
       WHERE cm.classId = ?
       ORDER BY u.fullName ASC`,
      [classId]
    );
    return rows;
  },
};

module.exports = ClassMemberModel;
