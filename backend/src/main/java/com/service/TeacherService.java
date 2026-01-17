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
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.util.SecurityUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

  private static String normalizeName(String s) {
    if (s == null) return "";
    // trim + gộp nhiều khoảng trắng + lower-case
    return s.trim().replaceAll("\\s+", " ").toLowerCase();
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

    String normName = normalizeName(req.className());
    if (classRepo.existsByTeacherIdAndNormalizedName(currentTeacherId(), normName)) {
      throw new ApiException(HttpStatus.CONFLICT, "Tên lớp đã tồn tại");
    }

    ClassEntity cls = new ClassEntity();
    cls.setClassName(req.className());
    cls.setNormalizedName(normName);
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

    String normName = normalizeName(req.className());
    if (classRepo.existsByTeacherIdAndNormalizedNameAndIdNot(currentTeacherId(), normName, classId)) {
      throw new ApiException(HttpStatus.CONFLICT, "Tên lớp đã tồn tại");
    }

    cls.setClassName(req.className());
    cls.setNormalizedName(normName);
    return classRepo.save(cls);
  }

  
  @Transactional
  public Map<String, Object> deleteClass(Long classId) {
    ClassEntity cls = classRepo.findById(classId).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Class not found");
    }

    // 1) delete attendance of all sessions in this class
    var sessions = sessionRepo.findByClassId(classId);
    if (sessions != null && !sessions.isEmpty()) {
      var sessionIds = sessions.stream().map(SessionEntity::getId).toList();
      attendanceRepo.deleteBySessionIdIn(sessionIds);
    }

    // 2) delete sessions
    sessionRepo.deleteByClassId(classId);

    // 3) delete roster (members)
    classMemberRepo.deleteByClassId(classId);

    // 4) delete class
    classRepo.delete(cls);

    return Map.of("message", "Deleted class (members + sessions + attendance)");
  }

  @Transactional
  public Map<String, Object> deleteSession(Long sessionId) {
    SessionEntity session = sessionRepo.findById(sessionId).orElse(null);
    if (session == null) throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");

    ClassEntity cls = classRepo.findById(session.getClassId()).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    attendanceRepo.deleteBySessionId(sessionId);
    sessionRepo.delete(session);

    return Map.of("message", "Deleted session and its attendance");
  }

  @Transactional
  public Map<String, Object> manualAttendance(Long sessionId, TeacherDtos.ManualAttendanceRequest req) {
    SessionEntity session = sessionRepo.findById(sessionId).orElse(null);
    if (session == null) throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");

    ClassEntity cls = classRepo.findById(session.getClassId()).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    Long studentId = req.studentId();
    if (studentId == null) throw new ApiException(HttpStatus.BAD_REQUEST, "studentId is required");

    // only allow manual check-in for students in this class
    if (!classMemberRepo.existsByClassIdAndStudentId(cls.getId(), studentId)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Student is not in this class");
    }

    var existing = attendanceRepo.findBySessionIdAndStudentId(sessionId, studentId).orElse(null);
    if (existing != null) {
      return Map.of(
          "message", "Student already checked in",
          "attendanceId", existing.getId(),
          "status", existing.getStatus()
      );
    }

    Attendance a = new Attendance();
    a.setSessionId(sessionId);
    a.setStudentId(studentId);
    a.setCheckInTime(LocalDateTime.now());
    a.setGpsLat(null);
    a.setGpsLng(null);
    a.setPhotoUrl(null);
    // NOTE: DB thường khai báo status là ENUM (ON_TIME/LATE/ABSENT).
    // Nếu lưu giá trị lạ sẽ bị lỗi "Data truncated for column 'status'".
    // Điểm danh thủ công sẽ được tính như có mặt đúng giờ.
    a.setStatus(AttendanceStatus.ON_TIME);

    Attendance saved = attendanceRepo.save(a);

    return new LinkedHashMap<>(Map.of(
        "message", "Manual check-in saved",
        "attendanceId", saved.getId(),
        "studentId", saved.getStudentId(),
        "sessionId", saved.getSessionId(),
        "status", saved.getStatus()
    ));
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

    String normTitle = normalizeName(req.title());
    if (sessionRepo.existsByClassIdAndNormalizedTitle(classId, normTitle)) {
      throw new ApiException(HttpStatus.CONFLICT, "Tên buổi học đã tồn tại");
    }

    SessionEntity s = new SessionEntity();
    s.setClassId(classId);
    s.setTitle(req.title());
    s.setNormalizedTitle(normTitle);
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
   * Export điểm danh của 1 buổi học ra file Excel (.xlsx).
   * - Tổng hợp TẤT CẢ sinh viên trong lớp (kể cả chưa điểm danh).
   */
  public byte[] exportSessionAttendanceXlsx(Long sessionId) {
    SessionEntity session = sessionRepo.findById(sessionId).orElse(null);
    if (session == null) throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");

    ClassEntity cls = classRepo.findById(session.getClassId()).orElse(null);
    if (cls == null || !Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    // 1) Danh sách tất cả sinh viên trong lớp
    List<Object[]> studentsRows = classMemberRepo.findStudentsByClass(cls.getId()); // [id, fullName, email]

    // 2) Map điểm danh theo studentId (nếu có)
    Map<Long, Attendance> attMap = new HashMap<>();
    for (Attendance a : attendanceRepo.findBySessionId(sessionId)) {
      attMap.put(a.getStudentId(), a);
    }

    try (Workbook wb = new XSSFWorkbook()) {
      Sheet sh = wb.createSheet("Attendance");

      // style header
      Font headerFont = wb.createFont();
      headerFont.setBold(true);
      CellStyle headerStyle = wb.createCellStyle();
      headerStyle.setFont(headerFont);
      headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
      headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
      headerStyle.setBorderBottom(BorderStyle.THIN);
      headerStyle.setBorderTop(BorderStyle.THIN);
      headerStyle.setBorderLeft(BorderStyle.THIN);
      headerStyle.setBorderRight(BorderStyle.THIN);

      // 0) Meta rows
      int r = 0;
      Row meta1 = sh.createRow(r++);
      meta1.createCell(0).setCellValue("Lớp:");
      meta1.createCell(1).setCellValue(cls.getClassName());
      Row meta2 = sh.createRow(r++);
      meta2.createCell(0).setCellValue("Buổi học:");
      meta2.createCell(1).setCellValue(session.getTitle());
      Row meta3 = sh.createRow(r++);
      meta3.createCell(0).setCellValue("Thời gian:");
      meta3.createCell(1).setCellValue(String.valueOf(session.getSessionDate()));

      r++; // blank row

      // 1) Header row
      Row header = sh.createRow(r++);
      String[] cols = {"STT", "StudentId", "Họ tên", "Email", "Trạng thái", "Thời điểm check-in"};
      for (int i = 0; i < cols.length; i++) {
        Cell c = header.createCell(i);
        c.setCellValue(cols[i]);
        c.setCellStyle(headerStyle);
      }

      // 2) Data rows
      int stt = 1;
      for (Object[] srow : studentsRows) {
        Long studentId = ((Number) srow[0]).longValue();
        String fullName = String.valueOf(srow[1]);
        String email = String.valueOf(srow[2]);

        Attendance a = attMap.get(studentId);

        Row row = sh.createRow(r++);
        row.createCell(0).setCellValue(stt++);
        row.createCell(1).setCellValue(studentId);
        row.createCell(2).setCellValue(fullName);
        row.createCell(3).setCellValue(email);
        row.createCell(4).setCellValue(a != null ? String.valueOf(a.getStatus()) : "ABSENT");
        row.createCell(5).setCellValue(a != null && a.getCheckInTime() != null ? String.valueOf(a.getCheckInTime()) : "");
      }

      for (int i = 0; i < cols.length; i++) {
        sh.autoSizeColumn(i);
      }

      try (java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream()) {
        wb.write(bos);
        return bos.toByteArray();
      }
    } catch (Exception e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Export failed: " + e.getMessage());
    }
  }
  /**
   * Export báo cáo chuyên cần TỔNG HỢP theo LỚP ra Excel (.xlsx).
   * - Hàng: sinh viên
   * - Cột: từng buổi học (session) + tổng có mặt/vắng + tỷ lệ %
   */
  public byte[] exportClassAttendanceSummaryXlsx(Long classId) {
    ClassEntity cls = classRepo.findById(classId).orElse(null);
    if (cls == null) throw new ApiException(HttpStatus.NOT_FOUND, "Class not found");
    if (!Objects.equals(cls.getTeacherId(), currentTeacherId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    // 1) Danh sách buổi học của lớp (cũ -> mới)
    List<SessionEntity> sessions = sessionRepo.findByClassIdOrderBySessionDateAsc(classId);

    // 2) Danh sách sinh viên trong lớp
    List<Object[]> studentsRows = classMemberRepo.findStudentsByClass(classId); // [id, fullName, email]

    // 3) Map điểm danh: sessionId -> (studentId -> status)
    Map<Long, Map<Long, AttendanceStatus>> map = new HashMap<>();
    for (SessionEntity s : sessions) {
      Map<Long, AttendanceStatus> per = new HashMap<>();
      for (Attendance a : attendanceRepo.findBySessionId(s.getId())) {
        per.put(a.getStudentId(), a.getStatus());
      }
      map.put(s.getId(), per);
    }

    DateTimeFormatter df = DateTimeFormatter.ofPattern("dd/MM");
    try (Workbook wb = new XSSFWorkbook()) {
      Sheet sh = wb.createSheet("Summary");

      // header style
      Font headerFont = wb.createFont();
      headerFont.setBold(true);
      CellStyle headerStyle = wb.createCellStyle();
      headerStyle.setFont(headerFont);
      headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
      headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
      headerStyle.setBorderBottom(BorderStyle.THIN);
      headerStyle.setBorderTop(BorderStyle.THIN);
      headerStyle.setBorderLeft(BorderStyle.THIN);
      headerStyle.setBorderRight(BorderStyle.THIN);

      int r = 0;

      // Meta
      Row meta1 = sh.createRow(r++);
      meta1.createCell(0).setCellValue("Lớp:");
      meta1.createCell(1).setCellValue(cls.getClassName() + " (" + cls.getCode() + ")");
      Row meta2 = sh.createRow(r++);
      meta2.createCell(0).setCellValue("Số buổi:");
      meta2.createCell(1).setCellValue(sessions.size());
      Row meta3 = sh.createRow(r++);
      meta3.createCell(0).setCellValue("Xuất lúc:");
      meta3.createCell(1).setCellValue(LocalDateTime.now().toString());

      r++; // blank

      // Header row
      Row header = sh.createRow(r++);
      int c = 0;
      Cell h0 = header.createCell(c++); h0.setCellValue("Student ID"); h0.setCellStyle(headerStyle);
      Cell h1 = header.createCell(c++); h1.setCellValue("Họ tên"); h1.setCellStyle(headerStyle);

      // session columns
      int idx = 1;
      for (SessionEntity s : sessions) {
        String label = "Buổi " + (idx++) + " (" + s.getSessionDate().format(df) + ") - " + s.getTitle();
        Cell hc = header.createCell(c++);
        hc.setCellValue(label);
        hc.setCellStyle(headerStyle);
      }

      Cell hPresent = header.createCell(c++); hPresent.setCellValue("Có mặt"); hPresent.setCellStyle(headerStyle);
      Cell hAbsent = header.createCell(c++); hAbsent.setCellValue("Vắng"); hAbsent.setCellStyle(headerStyle);
      Cell hRate = header.createCell(c++); hRate.setCellValue("Tỷ lệ %"); hRate.setCellStyle(headerStyle);

      // Data rows
      for (Object[] row : studentsRows) {
        Long studentId = (Long) row[0];
        String fullName = (String) row[1];

        Row rr = sh.createRow(r++);
        int cc = 0;
        rr.createCell(cc++).setCellValue(studentId);
        rr.createCell(cc++).setCellValue(fullName);

        int present = 0;
        int absent = 0;

        for (SessionEntity s : sessions) {
          AttendanceStatus st = null;
          Map<Long, AttendanceStatus> per = map.get(s.getId());
          if (per != null) st = per.get(studentId);

          // Mặc định không có record => ABSENT
          String cellVal;
          if (st == null || st == AttendanceStatus.ABSENT) {
            cellVal = "A";
            absent++;
          } else if (st == AttendanceStatus.LATE) {
            cellVal = "L";
            present++;
          } else { // ON_TIME
            cellVal = "P";
            present++;
          }
          rr.createCell(cc++).setCellValue(cellVal);
        }

        rr.createCell(cc++).setCellValue(present);
        rr.createCell(cc++).setCellValue(absent);

        double rate = sessions.isEmpty() ? 0.0 : (present * 100.0 / sessions.size());
        rr.createCell(cc++).setCellValue(Math.round(rate * 100.0) / 100.0);
      }

      // autosize
      int totalCols = 2 + sessions.size() + 3;
      for (int i = 0; i < totalCols; i++) sh.autoSizeColumn(i);

      // legend
      r++;
      Row legend = sh.createRow(r++);
      legend.createCell(0).setCellValue("Chú thích:");
      legend.createCell(1).setCellValue("P = Có mặt, L = Đi trễ, A = Vắng");

      java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
      wb.write(out);
      return out.toByteArray();
    } catch (Exception e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Export failed");
    }
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