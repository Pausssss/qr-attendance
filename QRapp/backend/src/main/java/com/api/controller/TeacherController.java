
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
 * - Tạo session
 * - Mở/đóng điểm danh và xem báo cáo
 */
@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {

  private final TeacherService teacherService;

  public TeacherController(TeacherService teacherService) {
    this.teacherService = teacherService;
  }

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
  public ClassEntity updateClass(@PathVariable Long id, @Valid @RequestBody TeacherDtos.UpdateClassRequest req) {
    return teacherService.updateClass(id, req);
  }

  @DeleteMapping("/classes/{id}")
  public Map<String, Object> deleteClass(@PathVariable Long id) {
    return teacherService.deleteClass(id);
  }

  @GetMapping("/classes/{id}/members")
  public List<Map<String, Object>> members(@PathVariable Long id) {
    return teacherService.getClassMembers(id);
  }

  @PostMapping("/classes/{id}/sessions")
  @ResponseStatus(HttpStatus.CREATED)
  public SessionEntity createSession(@PathVariable Long id, @Valid @RequestBody TeacherDtos.CreateSessionRequest req) {
    return teacherService.createSession(id, req);
  }

  @GetMapping("/classes/{id}/sessions")
  public List<SessionEntity> getSessions(@PathVariable Long id) {
    return teacherService.getSessions(id);
  }

  @PutMapping("/sessions/{sessionId}/open")
  public Map<String, Object> openSession(@PathVariable Long sessionId, @Valid @RequestBody TeacherDtos.OpenSessionRequest req) {
    return teacherService.openSession(sessionId, req);
  }

  @PutMapping("/sessions/{sessionId}/close")
  public SessionEntity closeSession(@PathVariable Long sessionId) {
    return teacherService.closeSession(sessionId);
  }

  @GetMapping("/sessions/{sessionId}/attendance")
  public List<Map<String, Object>> attendance(@PathVariable Long sessionId) {
    return teacherService.getSessionAttendance(sessionId);
  }

  @GetMapping("/classes/{id}/report")
  public Map<String, Object> report(@PathVariable Long id) {
    return teacherService.getClassReport(id);
  }

  @DeleteMapping("/classes/{classId}/members/{memberId}")
  public Map<String, Object> removeMember(@PathVariable Long classId, @PathVariable Long memberId) {
  return teacherService.removeMember(classId, memberId);
}
}
