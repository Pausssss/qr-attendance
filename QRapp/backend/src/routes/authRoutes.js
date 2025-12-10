const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const GoogleAuthController = require('../controllers/googleAuthController');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', AuthController.me);

router.post('/google', GoogleAuthController.loginWithGoogle);

module.exports = router;
