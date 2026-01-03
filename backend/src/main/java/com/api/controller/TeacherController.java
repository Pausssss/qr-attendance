package com.api.controller;

import com.api.dto.TeacherDtos;
import com.domain.entity.ClassEntity;
import com.domain.entity.SessionEntity;
import com.service.TeacherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API cho giảng viên:
 * - Quản lý lớp
 * - Quản lý buổi học (session)
 * - Mở/đóng điểm danh + xem báo cáo
 * - Điểm danh thủ công (fallback)
 */
@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {

  private final TeacherService teacherService;

  public TeacherController(TeacherService teacherService) {
    this.teacherService = teacherService;
  }

  // =====================
  // CLASSES
  // =====================
  @GetMapping("/classes")
  public List<ClassEntity> getMyClasses() {
    return teacherService.getMyClasses();
  }

  @PostMapping("/classes")
  @ResponseStatus(HttpStatus.CREATED)
  public ClassEntity createClass(@Valid @RequestBody TeacherDtos.CreateClassRequest req) {
    return teacherService.createClass(req);
  }

  @PutMapping("/classes/{id}")
  public ClassEntity updateClass(@PathVariable Long id,
                                 @Valid @RequestBody TeacherDtos.UpdateClassRequest req) {
    return teacherService.updateClass(id, req);
  }

  /** Xóa lớp (bao gồm members + sessions + attendance). */
  @DeleteMapping("/classes/{id}")
  public Map<String, Object> deleteClass(@PathVariable Long id) {
    return teacherService.deleteClass(id);
  }

  /** Xóa toàn bộ danh sách lớp (chỉ members) - không xóa lớp. */
  @DeleteMapping("/classes/{id}/members")
  public Map<String, Object> clearMembers(@PathVariable Long id) {
    return teacherService.clearClassMembers(id);
  }

  @GetMapping("/classes/{id}/members")
  public List<Map<String, Object>> members(@PathVariable Long id) {
    return teacherService.getClassMembers(id);
  }

  @DeleteMapping("/classes/{classId}/members/{memberId}")
  public Map<String, Object> removeMember(@PathVariable Long classId, @PathVariable Long memberId) {
    return teacherService.removeMember(classId, memberId);
  }

  // =====================
  // SESSIONS
  // =====================
  @PostMapping("/classes/{id}/sessions")
  @ResponseStatus(HttpStatus.CREATED)
  public SessionEntity createSession(@PathVariable Long id,
                                     @Valid @RequestBody TeacherDtos.CreateSessionRequest req) {
    return teacherService.createSession(id, req);
  }

  @GetMapping("/classes/{id}/sessions")
  public List<SessionEntity> getSessions(@PathVariable Long id) {
    return teacherService.getSessions(id);
  }

  /** Xóa 1 buổi học (session) + xóa toàn bộ attendance trong buổi đó. */
  @DeleteMapping("/sessions/{sessionId}")
  public Map<String, Object> deleteSession(@PathVariable Long sessionId) {
    return teacherService.deleteSession(sessionId);
  }

  @PutMapping("/sessions/{sessionId}/open")
  public Map<String, Object> openSession(@PathVariable Long sessionId,
                                         @Valid @RequestBody TeacherDtos.OpenSessionRequest req) {
    return teacherService.openSession(sessionId, req);
  }

  @PutMapping("/sessions/{sessionId}/close")
  public SessionEntity closeSession(@PathVariable Long sessionId) {
    return teacherService.closeSession(sessionId);
  }

  /** Điểm danh thủ công cho sinh viên trong buổi học. */
  @PostMapping("/sessions/{sessionId}/manual-attendance")
  public Map<String, Object> manualAttendance(@PathVariable Long sessionId,
                                              @Valid @RequestBody TeacherDtos.ManualAttendanceRequest req) {
    return teacherService.manualAttendance(sessionId, req);
  }

  @GetMapping("/sessions/{sessionId}/attendance")
  public List<Map<String, Object>> attendance(@PathVariable Long sessionId) {
    return teacherService.getSessionAttendance(sessionId);
  }

  // =====================
  // REPORT
  // =====================
  @GetMapping("/classes/{id}/report")
  public Map<String, Object> report(@PathVariable Long id) {
    return teacherService.getClassReport(id);
  }
}
