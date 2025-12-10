const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { signJwt } = require('../utils/jwt');

const AuthController = {
  async register(req, res, next) {
    try {
      const { fullName, email, password, role } = req.body;

      if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: 'Missing fields' });
      }
      if (!['TEACHER', 'STUDENT'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserModel.createUser({
        fullName,
        email,
        passwordHash,
        role,
      });

      const token = signJwt({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({ user, token });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const safeUser = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      };

      const token = signJwt(safeUser);

      res.json({ user: safeUser, token });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
