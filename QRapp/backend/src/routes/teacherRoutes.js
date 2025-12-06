// File: qr-attendance-backend/src/routes/teacherRoutes.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const TeacherController = require('../controllers/teacherController');

const router = express.Router();

router.use(authMiddleware, requireRole('TEACHER'));

// Classes
router.get('/classes', TeacherController.getMyClasses);
router.post('/classes', TeacherController.createClass);
router.put('/classes/:id', TeacherController.updateClass);
router.delete('/classes/:id', TeacherController.deleteClass);

// Members
router.get('/classes/:id/members', TeacherController.getClassMembers);

// Sessions
router.post('/classes/:id/sessions', TeacherController.createSession);
router.get('/classes/:id/sessions', TeacherController.getSessions);
router.put('/sessions/:sessionId/open', TeacherController.openSession);
router.put('/sessions/:sessionId/close', TeacherController.closeSession);

// Attendance & report
router.get('/sessions/:sessionId/attendance', TeacherController.getSessionAttendance);
router.get('/classes/:id/report', TeacherController.getClassReport);

module.exports = router;
