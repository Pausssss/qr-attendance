// File: backend/src/controllers/googleAuthController.js
const { OAuth2Client } = require('google-auth-library');
const { GOOGLE_CLIENT_ID } = require('../config/env');
const UserModel = require('../models/userModel');
const { signJwt } = require('../utils/jwt');

// LOG để chắc chắn env đang có client id
console.log('GOOGLE_CLIENT_ID (backend):', GOOGLE_CLIENT_ID);

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  // Bọc try/catch để nếu token sai thì trả ra lỗi dễ hiểu
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    console.error('verifyGoogleToken error:', err.message);
    // ném lại để controller xử lý
    throw new Error('Invalid Google token');
  }
}

const GoogleAuthController = {
  async loginWithGoogle(req, res, next) {
    try {
      const { idToken, role } = req.body;
      if (!idToken) {
        return res.status(400).json({ message: 'Missing idToken' });
      }

      if (!GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID is missing in env');
        return res
          .status(500)
          .json({ message: 'Server chưa cấu hình GOOGLE_CLIENT_ID' });
      }

      console.log('Received Google idToken (first 20 chars):', idToken.slice(0, 20));

      let profile;
      try {
        profile = await verifyGoogleToken(idToken);
      } catch (err) {
        // Token không hợp lệ
        return res.status(400).json({ message: err.message });
      }

      console.log('Google profile:', profile);

      let user = await UserModel.findByGoogleId(profile.googleId);

      if (!user) {
        const createRole =
          role && ['TEACHER', 'STUDENT'].includes(role)
            ? role
            : 'STUDENT';

        console.log('Creating new user with role:', createRole);

        user = await UserModel.createUser({
          fullName: profile.fullName,
          email: profile.email,
          googleId: profile.googleId,
          passwordHash: null,
          role: createRole,
        });
      }

      const token = signJwt({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });

      const safeUser = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      };

      res.json({ user: safeUser, token });
    } catch (err) {
      console.error('Google login unexpected error:', err);
      // lỗi không mong đợi
      return res.status(500).json({ message: 'Internal Google login error' });
    }
  },
};

module.exports = GoogleAuthController;
