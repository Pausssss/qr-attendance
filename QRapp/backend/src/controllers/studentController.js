const ClassModel = require('../models/classModel');
const ClassMemberModel = require('../models/classMemberModel');
const AttendanceModel = require('../models/attendanceModel');

const StudentController = {
  async getMyClasses(req, res, next) {
    try {
      const classes = await ClassMemberModel.getClassesByStudent(req.user.id);
      res.json(classes);
    } catch (err) {
      next(err);
    }
  },

  async joinClass(req, res, next) {
    try {
      const { classCode } = req.body;
      if (!classCode) return res.status(400).json({ message: 'classCode required' });

      const cls = await ClassModel.findByCode(classCode);
      if (!cls) return res.status(404).json({ message: 'Class not found' });

      const member = await ClassMemberModel.addStudentToClass({
        classId: cls.id,
        studentId: req.user.id
      });
      res.json({ class: cls, member });
    } catch (err) {
      next(err);
    }
  },

  async getAttendanceHistory(req, res, next) {
    try {
      const { classId } = req.query;
      if (!classId) return res.status(400).json({ message: 'classId required' });

      const inClass = await ClassMemberModel.isStudentInClass(classId, req.user.id);
      if (!inClass) return res.status(403).json({ message: 'Not in class' });

      const rows = await AttendanceModel.getByStudentAndClass(req.user.id, classId);
      // Already LEFT JOIN; can derive ABSENT from null
      const history = rows.map((r) => ({
        sessionId: r.sessionId,
        title: r.title,
        sessionDate: r.sessionDate,
        status: r.status || 'ABSENT',
        checkInTime: r.checkInTime
      }));

      res.json(history);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = StudentController;
