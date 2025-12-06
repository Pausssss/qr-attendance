// File: backend/src/controllers/attendanceController.js
const { ATTENDANCE_ON_TIME_MINUTES } = require('../config/env');
const SessionModel = require('../models/sessionModel');
const ClassModel = require('../models/classModel');
const ClassMemberModel = require('../models/classMemberModel');
const AttendanceModel = require('../models/attendanceModel');

const MAX_DISTANCE_METERS = 50; // khoảng cách tối đa GV – SV cho phép

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // m
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const AttendanceController = {
  async checkIn(req, res, next) {
    try {
      const { payload, gpsLat, gpsLng, photoUrl } = req.body;
      // payload expected: { sessionId, qrToken }
      if (!payload || !payload.sessionId || !payload.qrToken) {
        return res.status(400).json({ message: 'Invalid QR payload' });
      }

      // BẮT BUỘC PHẢI CÓ GPS
      const lat = gpsLat !== undefined ? parseFloat(gpsLat) : NaN;
      const lng = gpsLng !== undefined ? parseFloat(gpsLng) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res
          .status(400)
          .json({ message: 'Thiết bị cần bật GPS và cho phép truy cập vị trí.' });
      }

      const sessionId = payload.sessionId;
      const qrToken = payload.qrToken;

      const session = await SessionModel.getById(sessionId);
      if (!session) return res.status(404).json({ message: 'Session not found' });

      if (session.status !== 'OPEN') {
        return res.status(400).json({ message: 'Session is not open' });
      }

      if (!session.qrToken || session.qrToken !== qrToken) {
        return res.status(400).json({ message: 'Invalid qrToken' });
      }

      // Kiểm tra QR HẾT HẠN
      const now = new Date();
      if (
        session.qrTokenExpiresAt &&
        now > new Date(session.qrTokenExpiresAt)
      ) {
        return res
          .status(400)
          .json({ message: 'Mã QR đã hết hạn, hãy yêu cầu giảng viên mở lại.' });
      }

      // Kiểm tra khoảng cách với vị trí GV nếu có lưu
      if (session.teacherLat != null && session.teacherLng != null) {
        const dist = distanceInMeters(
          Number(session.teacherLat),
          Number(session.teacherLng),
          lat,
          lng
        );
        if (dist > MAX_DISTANCE_METERS) {
          return res.status(400).json({
            message:
              'Bạn đang ở quá xa vị trí lớp học, không thể điểm danh (≈ ' +
              Math.round(dist) +
              ' m).',
          });
        }
      }

      const classId = session.classId;
      const inClass = await ClassMemberModel.isStudentInClass(
        classId,
        req.user.id
      );
      if (!inClass) {
        return res
          .status(403)
          .json({ message: 'Student is not in this class' });
      }

      // Không cho check-in 2 lần
      const existing = await AttendanceModel.getBySessionAndStudent(
        sessionId,
        req.user.id
      );
      if (existing) {
        return res.status(400).json({ message: 'Already checked in' });
      }

      const sessionDate = new Date(session.sessionDate);
      const onTimeBoundary = new Date(
        sessionDate.getTime() + ATTENDANCE_ON_TIME_MINUTES * 60000
      );

      let status = 'ON_TIME';
      if (now > onTimeBoundary) status = 'LATE';

      const attendance = await AttendanceModel.createAttendance({
        sessionId,
        studentId: req.user.id,
        checkInTime: now,
        gpsLat: lat,
        gpsLng: lng,
        photoUrl: photoUrl || null,
        status,
      });

      res.json({ message: 'Check-in success', attendance });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AttendanceController;
