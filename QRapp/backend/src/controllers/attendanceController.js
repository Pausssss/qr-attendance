const { ATTENDANCE_ON_TIME_MINUTES } = require('../config/env');
const SessionModel = require('../models/sessionModel');
const ClassMemberModel = require('../models/classMemberModel');
const AttendanceModel = require('../models/attendanceModel');

const MAX_DISTANCE_METERS = 50;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const AttendanceController = {
  async checkIn(req, res, next) {
    try {
      const { payload, gpsLat, gpsLng, photoUrl } = req.body;

      // 1. Kiểm tra payload QR
      if (!payload || !payload.sessionId || !payload.qrToken) {
        return res.status(400).json({ message: 'Invalid QR payload' });
      }

      // 2. BẮT BUỘC CÓ ẢNH SELFIE
      if (!photoUrl || typeof photoUrl !== 'string') {
        return res.status(400).json({
          message: 'Cần chụp hình khuôn mặt để hoàn tất điểm danh.',
        });
      }

      // 3. GPS bắt buộc
      const lat = parseFloat(gpsLat);
      const lng = parseFloat(gpsLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({
          message: 'Thiết bị cần bật GPS và cho phép truy cập vị trí.',
        });
      }

      const sessionId = payload.sessionId;
      const qrToken = payload.qrToken;

      const session = await SessionModel.getById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      if (session.status !== 'OPEN') {
        return res.status(400).json({ message: 'Session is not open' });
      }

      // 4. Check QR token đúng
      if (!session.qrToken || session.qrToken !== qrToken) {
        return res.status(400).json({ message: 'Invalid qrToken' });
      }

      // 5. Check QR hết hạn
      const now = new Date();
      if (session.qrTokenExpiresAt && now > new Date(session.qrTokenExpiresAt)) {
        return res.status(400).json({
          message: 'Mã QR đã hết hạn, hãy yêu cầu giảng viên mở lại.',
        });
      }

      // 6. Kiểm tra khoảng cách với vị trí GV
      if (session.teacherLat != null && session.teacherLng != null) {
        const dist = distanceInMeters(
          Number(session.teacherLat),
          Number(session.teacherLng),
          lat,
          lng
        );

        if (dist > MAX_DISTANCE_METERS) {
          return res.status(400).json({
            message: `Bạn đang ở quá xa vị trí lớp học, không thể điểm danh (≈ ${Math.round(
              dist
            )} m).`,
          });
        }
      }

      //Kiểm tra sinh viên thuộc lớp
      const inClass = await ClassMemberModel.isStudentInClass(
        session.classId,
        req.user.id
      );
      if (!inClass) {
        return res.status(403).json({ message: 'Student is not in this class' });
      }

      //Không cho check-in 2 lần
      const existed = await AttendanceModel.getBySessionAndStudent(
        sessionId,
        req.user.id
      );
      if (existed) {
        return res.status(400).json({ message: 'Already checked in' });
      }

      //Xác định ON_TIME / LATE
      const sessionDate = new Date(session.sessionDate);
      const onTimeBoundary = new Date(
        sessionDate.getTime() + ATTENDANCE_ON_TIME_MINUTES * 60000
      );
      const status = now <= onTimeBoundary ? 'ON_TIME' : 'LATE';

      //Tạo điểm danh mới
      const attendance = await AttendanceModel.createAttendance({
        sessionId,
        studentId: req.user.id,
        checkInTime: now,
        gpsLat: lat,
        gpsLng: lng,
        photoUrl, 
        status,
      });

      res.json({ message: 'Check-in success', attendance });
    } catch (err) {
      next(err);
    }
  },

  async getStudentHistoryInClass(req, res, next) {
    try {
      const { classId } = req.params;
      const studentId = req.user.id;

      const rows = await AttendanceModel.getByStudentAndClass(
        studentId,
        classId
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
};
  
module.exports = AttendanceController;
