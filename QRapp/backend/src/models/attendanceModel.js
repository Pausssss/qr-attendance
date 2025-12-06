// File: backend/src/models/attendanceModel.js
const pool = require('../config/db');

const AttendanceModel = {
  async getBySessionAndStudent(sessionId, studentId) {
    const [rows] = await pool.query(
      'SELECT * FROM Attendance WHERE sessionId = ? AND studentId = ?',
      [sessionId, studentId]
    );
    return rows[0] || null;
  },

  async createAttendance({
    sessionId,
    studentId,
    checkInTime,
    gpsLat,
    gpsLng,
    photoUrl,
    status,
  }) {
    const [result] = await pool.query(
      `INSERT INTO Attendance
       (sessionId, studentId, checkInTime, gpsLat, gpsLng, photoUrl, status)
       VALUES (?,?,?,?,?,?,?)`,
      [sessionId, studentId, checkInTime, gpsLat, gpsLng, photoUrl, status]
    );
    const [rows] = await pool.query(
      'SELECT * FROM Attendance WHERE id = ?',
      [result.insertId]
    );
    return rows[0];
  },

  async getBySession(sessionId) {
    const [rows] = await pool.query(
      `SELECT a.*, u.fullName, u.email
       FROM Attendance a
       JOIN Users u ON a.studentId = u.id
       WHERE a.sessionId = ?
       ORDER BY a.checkInTime ASC`,
      [sessionId]
    );
    return rows;
  },

  // Cho lịch sử điểm danh của 1 sinh viên trong 1 lớp
  async getByStudentAndClass(studentId, classId) {
    const [rows] = await pool.query(
      `SELECT s.id AS sessionId,
              s.title,
              s.sessionDate,
              a.status,
              a.checkInTime
       FROM Sessions s
       LEFT JOIN Attendance a
         ON a.sessionId = s.id AND a.studentId = ?
       WHERE s.classId = ?
       ORDER BY s.sessionDate ASC`,
      [studentId, classId]
    );
    return rows;
  },

  // Cho báo cáo tổng theo lớp
  async getByClass(classId) {
    const [rows] = await pool.query(
      `SELECT a.*, s.classId, s.title, s.sessionDate
       FROM Attendance a
       JOIN Sessions s ON a.sessionId = s.id
       WHERE s.classId = ?`,
      [classId]
    );
    return rows;
  },
};

module.exports = AttendanceModel;
