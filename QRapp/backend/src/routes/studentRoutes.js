// File: qr-attendance-backend/src/routes/studentRoutes.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const StudentController = require('../controllers/studentController');

const router = express.Router();

router.use(authMiddleware, requireRole('STUDENT'));

router.get('/classes', StudentController.getMyClasses);
router.post('/classes/join', StudentController.joinClass);
router.get('/attendance/history', StudentController.getAttendanceHistory);

module.exports = router;
