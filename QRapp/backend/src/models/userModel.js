const pool = require('../config/db');

const UserModel = {
  /**
   * Dùng chung cho cả:
   *  - Đăng ký thường (có passwordHash, googleId = null)
   *  - Đăng nhập Google lần đầu (passwordHash = null, có googleId)
   */
  async createUser({ fullName, email, passwordHash = null, role, googleId = null }) {
    const [result] = await pool.query(
      'INSERT INTO Users (fullName, email, passwordHash, role, googleId, createdAt) VALUES (?,?,?,?,?,NOW())',
      [fullName, email, passwordHash, role, googleId]
    );

    const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [
      result.insertId,
    ]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [
      email,
    ]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByGoogleId(googleId) {
    const [rows] = await pool.query(
      'SELECT * FROM Users WHERE googleId = ?',
      [googleId]
    );
    return rows[0] || null;
  },
};

module.exports = UserModel;
