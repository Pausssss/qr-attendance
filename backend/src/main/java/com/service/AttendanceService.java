
package com.service;

import com.api.dto.AttendanceDtos;
import com.domain.entity.Attendance;
import com.domain.entity.SessionEntity;
import com.domain.enums.AttendanceStatus;
import com.domain.enums.SessionStatus;
import com.exception.ApiException;
import com.repo.AttendanceRepository;
import com.repo.ClassMemberRepository;
import com.repo.SessionRepository;
import com.util.SecurityUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AttendanceService {

  // Ngưỡng điểm danh theo GPS (m)
  private static final double MAX_DISTANCE_METERS = 50.0;

  private final SessionRepository sessionRepo;
  private final ClassMemberRepository classMemberRepo;
  private final AttendanceRepository attendanceRepo;
  private final int onTimeMinutes;

  public AttendanceService(SessionRepository sessionRepo,
                           ClassMemberRepository classMemberRepo,
                           AttendanceRepository attendanceRepo,
                           com.config.AppProperties props) {
    this.sessionRepo = sessionRepo;
    this.classMemberRepo = classMemberRepo;
    this.attendanceRepo = attendanceRepo;
    this.onTimeMinutes = props.getAttendance().getOnTimeMinutes();
  }

  private Long studentId() {
    var cu = SecurityUtil.currentUser();
    if (cu == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Missing token");
    return cu.getId();
  }
  /**
   * Sinh viên điểm danh bằng QR.
   * @param sessionId id buổi học
   * @param qrToken token từ QR do giảng viên tạo
   * @param gpsLat vĩ độ hiện tại của sinh viên
   * @param gpsLng kinh độ hiện tại của sinh viên
   * @param photoUrl url ảnh minh chứng (tuỳ chọn)
   */
  public Map<String, Object> checkIn(AttendanceDtos.CheckInRequest req) {
    Long sessionId = req.payload().sessionId();
    String qrToken = req.payload().qrToken();
    Double gpsLat = req.gpsLat();
    Double gpsLng = req.gpsLng();
    String photoUrl = req.photoUrl();

    // Tránh client gửi base64 cực dài (data:image/...;base64,...) gây quá tải DB.
    if (photoUrl != null && photoUrl.startsWith("data:")) {
      throw new ApiException(HttpStatus.BAD_REQUEST,
          "Ảnh quá lớn. Vui lòng upload ảnh trước (/api/upload/photo) và gửi lại photoUrl dạng /uploads/...");
    }

    SessionEntity session = sessionRepo.findById(sessionId).orElse(null);
    if (session == null) throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");

    if (session.getStatus() != SessionStatus.OPEN) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Session is not open");
    }

    if (session.getQrToken() == null || !session.getQrToken().equals(qrToken)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid qrToken");
    }

    LocalDateTime now = LocalDateTime.now();
    if (session.getQrTokenExpiresAt() != null && now.isAfter(session.getQrTokenExpiresAt())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Mã QR đã hết hạn, hãy yêu cầu giảng viên mở lại.");
    }

    // distance check (if teacher gps exists)
    Double distanceMeters = null;
    if (session.getTeacherLat() != null && session.getTeacherLng() != null
        && gpsLat != null && gpsLng != null) {
      double dist = distanceInMeters(
          session.getTeacherLat().doubleValue(),
          session.getTeacherLng().doubleValue(),
          gpsLat,
          gpsLng
      );
      distanceMeters = dist;
      if (dist > MAX_DISTANCE_METERS) {
        throw new ApiException(
            HttpStatus.BAD_REQUEST,
            "Bạn đang ở quá xa vị trí lớp học, không thể điểm danh (≈ " + Math.round(dist) + " m).",
            Map.of(
                "distanceMeters", Math.round(dist),
                "maxDistanceMeters", Math.round(MAX_DISTANCE_METERS)
            )
        );
      }
    }

    // class membership
    if (!classMemberRepo.existsByClassIdAndStudentId(session.getClassId(), studentId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Student is not in this class");
    }

    // duplicate
    if (attendanceRepo.findBySessionIdAndStudentId(sessionId, studentId()).isPresent()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Already checked in");
    }

    LocalDateTime onTimeBoundary = session.getSessionDate().plusMinutes(onTimeMinutes);
    AttendanceStatus status = now.isAfter(onTimeBoundary) ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME;

        // Tạo bản ghi điểm danh (không dùng Lombok)
    Attendance att = new Attendance();
    att.setSessionId(sessionId);
    att.setStudentId(studentId());
    att.setCheckInTime(now);
    att.setGpsLat(BigDecimal.valueOf(gpsLat));
    att.setGpsLng(BigDecimal.valueOf(gpsLng));
    att.setPhotoUrl(photoUrl);
    att.setStatus(status);

att = attendanceRepo.save(att);

    return Map.of(
        "message", "Check-in success",
        "attendance", att,
        "distanceMeters", distanceMeters == null ? null : Math.round(distanceMeters),
        "maxDistanceMeters", Math.round(MAX_DISTANCE_METERS)
    );
  }

  private static double toRad(double deg) {
    return deg * Math.PI / 180.0;
  }

  private static double distanceInMeters(double lat1, double lng1, double lat2, double lng2) {
    double R = 6371000.0;
    double dLat = toRad(lat2 - lat1);
    double dLng = toRad(lng2 - lng1);
    double a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
