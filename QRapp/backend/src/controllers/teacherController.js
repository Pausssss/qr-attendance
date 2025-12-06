// File: qr-attendance-backend/src/controllers/teacherController.js
const { ATTENDANCE_ON_TIME_MINUTES } = require('../config/env');
const { generateClassCode } = require('../utils/generateCode');
const { generateRandomToken } = require('../utils/randomToken');
const ClassModel = require('../models/classModel');
const ClassMemberModel = require('../models/classMemberModel');
const SessionModel = require('../models/sessionModel');
const AttendanceModel = require('../models/attendanceModel');
const pool = require('../config/db');

const TeacherController = {
  // Classes
  async getMyClasses(req, res, next) {
    try {
      const classes = await ClassModel.getByTeacher(req.user.id);
      res.json(classes);
    } catch (err) {
      next(err);
    }
  },

  async createClass(req, res, next) {
    try {
      const { className } = req.body;
      if (!className) return res.status(400).json({ message: 'className required' });

      let code;
      let attempt = 0;
      do {
        code = generateClassCode();
        const existing = await ClassModel.findByCode(code);
        if (!existing) break;
        attempt++;
      } while (attempt < 5);

      const newClass = await ClassModel.createClass({
        className,
        code,
        teacherId: req.user.id
      });

      res.status(201).json(newClass);
    } catch (err) {
      next(err);
    }
  },

  async updateClass(req, res, next) {
    try {
      const { id } = req.params;
      const { className } = req.body;
      const cls = await ClassModel.getById(id);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(404).json({ message: 'Class not found' });
      }
      await ClassModel.updateClass(id, req.user.id, { className });
      const updated = await ClassModel.getById(id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteClass(req, res, next) {
    try {
      const { id } = req.params;
      const cls = await ClassModel.getById(id);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(404).json({ message: 'Class not found' });
      }
      await ClassModel.deleteClass(id, req.user.id);
      res.json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  },

  async getClassMembers(req, res, next) {
    try {
      const { id } = req.params;
      const cls = await ClassModel.getById(id);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(404).json({ message: 'Class not found' });
      }
      const members = await ClassMemberModel.getMembersByClass(id);
      res.json(members);
    } catch (err) {
      next(err);
    }
  },

  // Sessions
  async createSession(req, res, next) {
    try {
      const { id } = req.params; // classId
      const { title, sessionDate } = req.body;
      const cls = await ClassModel.getById(id);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(404).json({ message: 'Class not found' });
      }
      if (!title || !sessionDate) {
        return res.status(400).json({ message: 'title & sessionDate required' });
      }
      const session = await SessionModel.createSession({
        classId: id,
        title,
        sessionDate
      });
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  },

  async getSessions(req, res, next) {
    try {
      const { id } = req.params; // classId
      const cls = await ClassModel.getById(id);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(404).json({ message: 'Class not found' });
      }
      const sessions = await SessionModel.getSessionsByClass(id);
      res.json(sessions);
    } catch (err) {
      next(err);
    }
  },

  async openSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { teacherLat, teacherLng } = req.body || {};

      const lat = teacherLat !== undefined ? parseFloat(teacherLat) : NaN;
      const lng = teacherLng !== undefined ? parseFloat(teacherLng) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({
          message:
            'Không lấy được vị trí GPS của giảng viên. Hãy bật GPS trên thiết bị và thử lại.',
        });
      }

      const session = await SessionModel.getById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const cls = await ClassModel.getById(session.classId);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const qrToken = generateRandomToken(16);
      const sessionDate = new Date(session.sessionDate);
      const qrTokenExpiresAt = new Date(
        sessionDate.getTime() + ATTENDANCE_ON_TIME_MINUTES * 60000
      );

      await SessionModel.openSession(
        sessionId,
        qrToken,
        qrTokenExpiresAt,
        lat,
        lng
      );
      const updated = await SessionModel.getById(sessionId);

      res.json({
        ...updated,
        qrPayload: {
          sessionId: updated.id,
          qrToken: updated.qrToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async closeSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const session = await SessionModel.getById(sessionId);
      if (!session) return res.status(404).json({ message: 'Session not found' });
      const cls = await ClassModel.getById(session.classId);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      await SessionModel.closeSession(sessionId);
      const updated = await SessionModel.getById(sessionId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async getSessionAttendance(req, res, next) {
    try {
      const { sessionId } = req.params;
      const session = await SessionModel.getById(sessionId);
      if (!session) return res.status(404).json({ message: 'Session not found' });
      const cls = await ClassModel.getById(session.classId);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const attendance = await AttendanceModel.getBySession(sessionId);
      res.json(attendance);
    } catch (err) {
      next(err);
    }
  },

  // Report per class
  async getClassReport(req, res, next) {
    try {
      const { id } = req.params; // classId
      const cls = await ClassModel.getById(id);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(404).json({ message: 'Class not found' });
      }

      const students = await ClassMemberModel.getStudentsByClass(id);
      const sessions = await SessionModel.getSessionsByClass(id);
      const attendance = await AttendanceModel.getByClass(id);

      const perStudent = {};
      students.forEach((s) => {
        perStudent[s.studentId] = {
          studentId: s.studentId,
          fullName: s.fullName,
          email: s.email,
          totalSessions: sessions.length,
          onTime: 0,
          late: 0,
          present: 0,
          absent: 0
        };
      });

      const attendanceMap = {};
      attendance.forEach((a) => {
        if (!attendanceMap[a.sessionId]) attendanceMap[a.sessionId] = {};
        attendanceMap[a.sessionId][a.studentId] = a.status;

        const stu = perStudent[a.studentId];
        if (!stu) return;
        stu.present++;
        if (a.status === 'ON_TIME') stu.onTime++;
        if (a.status === 'LATE') stu.late++;
      });

      sessions.forEach((s) => {
        students.forEach((stu) => {
          const status =
            attendanceMap[s.id] && attendanceMap[s.id][stu.studentId]
              ? attendanceMap[s.id][stu.studentId]
              : 'ABSENT';
          if (status === 'ABSENT') {
            perStudent[stu.studentId].absent++;
          }
        });
      });

      res.json({
        class: cls,
        sessions,
        students,
        perStudent: Object.values(perStudent)
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = TeacherController;
