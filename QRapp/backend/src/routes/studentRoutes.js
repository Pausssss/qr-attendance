const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const StudentController = require('../controllers/studentController');
const AttendanceController = require('../controllers/attendanceController'); 

const router = express.Router();

router.use(authMiddleware, requireRole('STUDENT'));

router.get('/classes', StudentController.getMyClasses);
router.post('/classes/join', StudentController.joinClass);
router.get('/attendance/history', StudentController.getAttendanceHistory);
router.get('/classes/:classId/attendance-history',AttendanceController.getStudentHistoryInClass); //lịch sử điểm danh trong lớp

module.exports = router;
