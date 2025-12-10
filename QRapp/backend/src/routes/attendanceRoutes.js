const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const AttendanceController = require('../controllers/attendanceController');

const router = express.Router();

router.post(
  '/check-in',
  authMiddleware,
  requireRole('STUDENT'),
  AttendanceController.checkIn
);

module.exports = router;
