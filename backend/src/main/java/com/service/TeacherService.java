package com.service;

import com.api.dto.TeacherDtos;
import com.config.AppProperties;
import com.domain.entity.Attendance;
import com.domain.entity.ClassEntity;
import com.domain.entity.ClassMember;
import com.domain.entity.SessionEntity;
import com.domain.enums.AttendanceStatus;
import com.domain.enums.SessionStatus;
import com.exception.ApiException;
import com.repo.AttendanceRepository;
import com.repo.ClassMemberRepository;
import com.repo.ClassRepository;
import com.repo.SessionRepository;
import com.util.CodeUtil;
import com.util.SecurityUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service nghiệp vụ cho GIẢNG VIÊN.
 *
 * Chức năng chính:
 * - Quản lý lớp (tạo/sửa/xóa)
 * - Tạo buổi học (session)
 * - Mở/đóng session để sinh QR điểm danh
 * - Xem danh sách sinh viên + kết quả điểm danh
 * - Tổng hợp báo cáo điểm danh theo lớp
 */
@Service
public class TeacherService {

  private final ClassRepository classRepo;
  private final SessionRepository sessionRepo;
  private final ClassMemberRepository classMemberRepo;
  private final AttendanceRepository attendanceRepo;
  private final int onTimeMinutes;

  public TeacherService(ClassRepository classRepo,
                        SessionRepository sessionRepo,
                        ClassMemberRepository classMemberRepo,
                        AttendanceRepository attendanceRepo,
                        AppProperties props) {
    this.classRepo = classRepo;
    this.sessionRepo = sessionRepo;
    this.classMemberRepo = classMemberRepo;
    this.attendanceRepo = attendanceRepo;
    this.onTimeMinutes = props.getAttendance().getOnTimeMinutes();
  }

  /** Lấy id giảng viên hiện tại từ JWT. */
  private Long currentTeacherId() {
    var cu = SecurityUtil.currentUser();
    if (cu == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Thiếu token / chưa đăng nhập");
    return cu.getId();
  }

  public List<ClassEntity> getMyClasses() {
    return classRepo.findByTeacherIdOrderByCreatedAtDesc(currentTeacherId());
  }

  /** Tạo lớp mới và sinh mã lớp (code) ngẫu nhiên. */
  public ClassEntity createClass(TeacherDtos.CreateClassRequest req) {
    String code = null;
    for (int i = 0; i < 5; i++) {
      String tryCode = CodeUtil.generateClassCode();
      if (classRepo.findByCode(tryCode).isEmpty()) {
        code = tryCode;
        break;
      }
    }
    if (code == null) code = CodeUtil.generateClassCode();

    ClassEntity cls = new ClassEntity();
    cls.setClassName(req.className());
    cls.setCode(code);
    cls.setTeacherId(currentTeacherId());
    cls.setCreatedAt(LocalDateTime.now());

    try {
      return classRepo.save(cls);
    } catch (DataIntegrityViolationException ex) {
      // Trường hợp hiếm: trùng code do đua điều kiện
      throw new ApiException(HttpStatus.CONFLICT, "Trùng mã lớp, thử lại lần nữa");
    }
  }

  public ClassEntity updateClass(Long classId, TeacherDtos.UpdateClassRequest req) {
    ClassEntity cls = classRepo.findById(classId).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Class not found");
    }

    cls.setClassName(req.className());
    return classRepo.save(cls);
  }

  public Map<String, Object> deleteClass(Long classId) {
    ClassEntity cls = classRepo.findById(classId).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Class not found");
    }

    classRepo.delete(cls);
    return Map.of("message", "Deleted");
  }

  /**
   * Danh sách thành viên trong lớp.
   * Query repository trả về: (ClassMember cm, fullName, email)
   */
  public List<Map<String, Object>> getClassMembers(Long classId) {
    ClassEntity cls = classRepo.findById(classId).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Class not found");
    }

    List<Object[]> rows = classMemberRepo.findMembersByClass(classId);
    List<Map<String, Object>> out = new ArrayList<>();

    for (Object[] r : rows) {
      ClassMember cm = (ClassMember) r[0];
      String fullName = String.valueOf(r[1]);
      String email = String.valueOf(r[2]);

      Map<String, Object> row = new LinkedHashMap<>();
      row.put("id", cm.getId());
      row.put("classId", cm.getClassId());
      row.put("studentId", cm.getStudentId());
      row.put("joinedAt", cm.getJoinedAt());
      row.put("fullName", fullName);
      row.put("email", email);
      out.add(row);
    }

    return out;
  }

  /** Tạo một buổi học (session) cho lớp. */
  public SessionEntity createSession(Long classId, TeacherDtos.CreateSessionRequest req) {
    ClassEntity cls = classRepo.findById(classId).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Class not found");
    }

    SessionEntity s = new SessionEntity();
    s.setClassId(classId);
    s.setTitle(req.title());
    s.setSessionDate(req.sessionDate());
    s.setStatus(SessionStatus.CLOSED);
    s.setQrToken(null);
    s.setQrTokenExpiresAt(null);
    s.setTeacherLat(null);
    s.setTeacherLng(null);
    s.setCreatedAt(LocalDateTime.now());

    return sessionRepo.save(s);
  }

  /** Lấy danh sách buổi học của lớp (mới nhất trước). */
  public List<SessionEntity> getSessions(Long classId) {
    ClassEntity cls = classRepo.findById(classId).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Class not found");
    }

    return sessionRepo.findByClassIdOrderBySessionDateDesc(classId);
  }

  // Xóa thành viên khỏi lớp
  public Map<String, Object> removeMember(Long classId, Long memberId) {
  ClassEntity cls = classRepo.findById(classId).orElse(null);
  if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
    throw new ApiException(HttpStatus.NOT_FOUND, "Class not found");
  }
  ClassMember cm = classMemberRepo.findById(memberId).orElse(null);
  if (cm == null) {
    throw new ApiException(HttpStatus.NOT_FOUND, "Member not found");
  }

  // Đảm bảo member này thuộc đúng lớp đang thao tác
  if (!Objects.equals(cm.getClassId(), classId)) {
    throw new ApiException(HttpStatus.BAD_REQUEST, "Member not in this class");
  }

  classMemberRepo.delete(cm);
  return Map.of("message", "Removed");
}

  /**
   * Mở session để sinh QR điểm danh.
   * - set status=OPEN
   * - tạo qrToken
   * - set thời gian hết hạn (qrTokenExpiresAt)
   * - lưu vị trí của giảng viên để check khoảng cách (tuỳ chọn)
   */
  public Map<String, Object> openSession(Long sessionId, TeacherDtos.OpenSessionRequest req) {
    SessionEntity session = sessionRepo.findById(sessionId).orElse(null);
    if (session == null) throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");

    ClassEntity cls = classRepo.findById(session.getClassId()).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    String qrToken = CodeUtil.randomToken(16);

    // Hết hạn sau onTimeMinutes kể từ thời điểm GIẢNG VIÊN MỞ điểm danh.
    // Nếu dùng sessionDate thì mở lại sau giờ học sẽ bị hết hạn ngay lập tức.
    LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(onTimeMinutes);

    session.setStatus(SessionStatus.OPEN);
    session.setQrToken(qrToken);
    session.setQrTokenExpiresAt(expiresAt);
    session.setTeacherLat(BigDecimal.valueOf(req.teacherLat()));
    session.setTeacherLng(BigDecimal.valueOf(req.teacherLng()));

    session = sessionRepo.save(session);

    Map<String, Object> resp = new LinkedHashMap<>();
    resp.put("id", session.getId());
    resp.put("classId", session.getClassId());
    resp.put("title", session.getTitle());
    resp.put("sessionDate", session.getSessionDate());
    resp.put("status", session.getStatus());
    resp.put("qrToken", session.getQrToken());
    resp.put("qrTokenExpiresAt", session.getQrTokenExpiresAt());
    resp.put("teacherLat", session.getTeacherLat());
    resp.put("teacherLng", session.getTeacherLng());
    resp.put("createdAt", session.getCreatedAt());

    // Payload dùng để FE sinh QR (scan ra được sessionId + qrToken)
    resp.put("qrPayload", Map.of(
        "sessionId", session.getId(),
        "qrToken", session.getQrToken()
    ));

    return resp;
  }

  /** Đóng session: không cho điểm danh nữa. */
  public SessionEntity closeSession(Long sessionId) {
    SessionEntity session = sessionRepo.findById(sessionId).orElse(null);
    if (session == null) throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");

    ClassEntity cls = classRepo.findById(session.getClassId()).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    session.setStatus(SessionStatus.CLOSED);
    session.setQrToken(null);
    session.setQrTokenExpiresAt(null);
    return sessionRepo.save(session);
  }

  /**
   * Kết quả điểm danh của 1 buổi học.
   * Query repository trả về: (Attendance a, fullName, email)
   */
  public List<Map<String, Object>> getSessionAttendance(Long sessionId) {
    SessionEntity session = sessionRepo.findById(sessionId).orElse(null);
    if (session == null) throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");

    ClassEntity cls = classRepo.findById(session.getClassId()).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    List<Object[]> rows = attendanceRepo.findBySessionWithUser(sessionId);
    List<Map<String, Object>> out = new ArrayList<>();

    for (Object[] r : rows) {
      Attendance a = (Attendance) r[0];
      String fullName = String.valueOf(r[1]);
      String email = String.valueOf(r[2]);

      Map<String, Object> row = new LinkedHashMap<>();
      row.put("id", a.getId());
      row.put("sessionId", a.getSessionId());
      row.put("studentId", a.getStudentId());
      row.put("checkInTime", a.getCheckInTime());
      row.put("gpsLat", a.getGpsLat());
      row.put("gpsLng", a.getGpsLng());
      row.put("photoUrl", a.getPhotoUrl());
      row.put("status", a.getStatus());
      row.put("fullName", fullName);
      row.put("email", email);
      out.add(row);
    }

    return out;
  }

  /**
   * Báo cáo tổng hợp cho 1 lớp.
   * - tổng số buổi học
   * - thống kê theo từng sinh viên: onTime/late/present/absent
   */
  public Map<String, Object> getClassReport(Long classId) {
    ClassEntity cls = classRepo.findById(classId).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Class not found");
    }

    // 1) Danh sách sinh viên trong lớp
    List<Object[]> studentsRows = classMemberRepo.findStudentsByClass(classId);
    record StudentRow(Long studentId, String fullName, String email) {}

    List<StudentRow> students = new ArrayList<>();
    for (Object[] r : studentsRows) {
      students.add(new StudentRow(
          ((Number) r[0]).longValue(),
          String.valueOf(r[1]),
          String.valueOf(r[2])
      ));
    }

    // 2) Danh sách buổi học
    List<SessionEntity> sessions = sessionRepo.findByClassIdOrderBySessionDateDesc(classId);
    int totalSessions = sessions.size();

    // 3) Dữ liệu điểm danh theo lớp
    List<Object[]> attendanceRows = attendanceRepo.findByClassWithSession(classId);

    // perStudent[studentId] -> map thống kê
    Map<Long, Map<String, Object>> perStudent = new LinkedHashMap<>();
    for (StudentRow s : students) {
      perStudent.put(s.studentId(), new LinkedHashMap<>(Map.of(
          "studentId", s.studentId(),
          "fullName", s.fullName(),
          "email", s.email(),
          "totalSessions", totalSessions,
          "onTime", 0,
          "late", 0,
          "present", 0,
          "absent", 0
      )));
    }

    // attendanceMap[sessionId][studentId] = status
    Map<Long, Map<Long, String>> attendanceMap = new HashMap<>();

    for (Object[] r : attendanceRows) {
      Attendance a = (Attendance) r[0];
      Long sessionId = a.getSessionId();
      Long studentId = a.getStudentId();
      String status = (a.getStatus() == null) ? null : a.getStatus().name();

      attendanceMap.computeIfAbsent(sessionId, k -> new HashMap<>()).put(studentId, status);

      Map<String, Object> ps = perStudent.get(studentId);
      if (ps == null) continue;

      // present = có record điểm danh
      ps.put("present", ((Number) ps.get("present")).intValue() + 1);

      if (AttendanceStatus.ON_TIME.name().equals(status)) {
        ps.put("onTime", ((Number) ps.get("onTime")).intValue() + 1);
      } else if (AttendanceStatus.LATE.name().equals(status)) {
        ps.put("late", ((Number) ps.get("late")).intValue() + 1);
      }
    }

    // absent = totalSessions - present
    for (Map<String, Object> ps : perStudent.values()) {
      int present = ((Number) ps.get("present")).intValue();
      ps.put("absent", Math.max(totalSessions - present, 0));
    }

    Map<String, Object> resp = new LinkedHashMap<>();
    resp.put("class", cls);
    resp.put("sessions", sessions);
    resp.put("students", students.stream().map(s -> Map.of(
        "studentId", s.studentId(),
        "fullName", s.fullName(),
        "email", s.email()
    )).toList());
    resp.put("perStudent", perStudent.values());

    return resp;
  }
}
