package com.service;

import com.api.dto.StudentDtos;
import com.domain.entity.ClassEntity;
import com.domain.entity.ClassMember;
import com.domain.entity.SessionEntity;
import com.exception.ApiException;
import com.repo.AttendanceRepository;
import com.repo.ClassMemberRepository;
import com.repo.ClassRepository;
import com.repo.SessionRepository;
import com.util.SecurityUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service nghiệp vụ cho sinh viên.
 *
 * Mục tiêu:
 * - Code gọn, dễ đọc.
 * - Trả về dữ liệu đơn giản cho FE (Map) để bạn dễ debug.
 */
@Service
public class StudentService {

  private final ClassRepository classRepo;
  private final ClassMemberRepository classMemberRepo;
  private final SessionRepository sessionRepo;
  private final AttendanceRepository attendanceRepo;

  public StudentService(ClassRepository classRepo,
                        ClassMemberRepository classMemberRepo,
                        SessionRepository sessionRepo,
                        AttendanceRepository attendanceRepo) {
    this.classRepo = classRepo;
    this.classMemberRepo = classMemberRepo;
    this.sessionRepo = sessionRepo;
    this.attendanceRepo = attendanceRepo;
  }

  /**
   * Lấy id của sinh viên hiện tại từ JWT.
   * Nếu chưa đăng nhập -> ném lỗi 401.
   */
  private Long currentStudentId() {
    var cu = SecurityUtil.currentUser();
    if (cu == null) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Thiếu token / chưa đăng nhập");
    }
    return cu.getId();
  }

  /**
   * Danh sách lớp mà sinh viên đã tham gia.
   */
  public List<Map<String, Object>> getMyClasses() {
    List<Object[]> rows = classMemberRepo.findJoinedClasses(currentStudentId());
    List<Map<String, Object>> out = new ArrayList<>();

    for (Object[] r : rows) {
      ClassEntity c = (ClassEntity) r[0];
      LocalDateTime joinedAt = (LocalDateTime) r[1];

      Map<String, Object> row = new LinkedHashMap<>();
      row.put("id", c.getId());
      row.put("className", c.getClassName());
      row.put("code", c.getCode());
      row.put("teacherId", c.getTeacherId());
      row.put("createdAt", c.getCreatedAt());
      row.put("joinedAt", joinedAt);

      out.add(row);
    }

    return out;
  }

  /**
   * Tham gia lớp bằng mã classCode.
   * - Nếu mã không tồn tại -> 404
   * - Nếu đã tham gia rồi -> trả về thông tin lớp + member hiện có
   */
  public Map<String, Object> joinClass(StudentDtos.JoinClassRequest req) {
    Long studentId = currentStudentId();

    // Normalize mã lớp để tránh lỗi nhập chữ thường / copy có khoảng trắng.
    // Lưu ý: mã lớp được sinh dạng in hoa + số, nên việc normalize này an toàn.
    String normalizedCode = (req.classCode() == null) ? "" : req.classCode().trim().toUpperCase().replaceAll("\\s+", "");
    if (normalizedCode.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng nhập mã lớp");
    }

    ClassEntity cls = classRepo.findByCode(normalizedCode)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy lớp với mã: " + normalizedCode));

    // Nếu đã join rồi thì trả luôn (tránh ném exception DB)
    ClassMember existing = classMemberRepo.findByClassIdAndStudentId(cls.getId(), studentId).orElse(null);
    if (existing != null) {
      return Map.of(
          "message", "Bạn đã tham gia lớp này rồi",
          "class", cls,
          "member", existing
      );
    }

    // Tạo bản ghi tham gia lớp
    ClassMember member = new ClassMember();
    member.setClassId(cls.getId());
    member.setStudentId(studentId);
    member.setJoinedAt(LocalDateTime.now());

    try {
      member = classMemberRepo.save(member);
    } catch (DataIntegrityViolationException ex) {
      // Trường hợp hiếm: đua điều kiện (2 request cùng lúc) -> lấy lại bản ghi
      member = classMemberRepo.findByClassIdAndStudentId(cls.getId(), studentId).orElse(null);
    }

    return Map.of(
        "message", "Tham gia lớp thành công",
        "class", cls,
        "member", member
    );
  }

  /**
   * Danh sách buổi học (session) của 1 lớp.
   * Chỉ sinh viên đã tham gia lớp mới xem được.
   */
  public List<Map<String, Object>> getSessionsInClass(Long classId) {
    Long studentId = currentStudentId();

    if (!classMemberRepo.existsByClassIdAndStudentId(classId, studentId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Bạn chưa tham gia lớp này");
    }

    List<SessionEntity> sessions = sessionRepo.findByClassIdOrderBySessionDateDesc(classId);

    List<Map<String, Object>> out = new ArrayList<>();
    for (SessionEntity s : sessions) {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("id", s.getId());
      row.put("classId", s.getClassId());
      row.put("title", s.getTitle());
      row.put("sessionDate", s.getSessionDate());
      row.put("status", s.getStatus());
      row.put("qrTokenExpiresAt", s.getQrTokenExpiresAt());
      out.add(row);
    }

    return out;
  }

  /**
   * Lịch sử điểm danh của sinh viên trong 1 lớp.
   * Trả về 1 dòng cho mỗi buổi học (có thể ABSENT nếu chưa điểm danh).
   */
  public List<Map<String, Object>> getAttendanceHistoryInClass(Long classId) {
    Long studentId = currentStudentId();

    if (!classMemberRepo.existsByClassIdAndStudentId(classId, studentId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Bạn chưa tham gia lớp này");
    }

    List<Object[]> rows = attendanceRepo.findStudentHistoryInClass(studentId, classId);
    List<Map<String, Object>> out = new ArrayList<>();

    for (Object[] r : rows) {
      // sessionId, title, sessionDate, status, checkInTime
      String status = (r[3] == null) ? "ABSENT" : String.valueOf(r[3]);

      Map<String, Object> row = new LinkedHashMap<>();
      row.put("sessionId", ((Number) r[0]).longValue());
      row.put("title", r[1]);
      row.put("sessionDate", r[2]);
      row.put("status", status);
      row.put("checkInTime", r[4]);

      out.add(row);
    }

    return out;
  }
}
