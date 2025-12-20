package com.api.controller;

import com.api.dto.StudentDtos;
import com.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API dành cho SINH VIÊN.
 *
 * Note:
 * - Tất cả endpoint ở đây đều yêu cầu role STUDENT.
 * - Mục tiêu: sinh viên có thể xem lớp, xem buổi học, xem lịch sử điểm danh.
 */
@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

  private final StudentService studentService;

  public StudentController(StudentService studentService) {
    this.studentService = studentService;
  }

  /** Danh sách lớp mà sinh viên đã tham gia. */
  @GetMapping("/classes")
  public List<Map<String, Object>> myClasses() {
    return studentService.getMyClasses();
  }

  /** Tham gia lớp bằng mã lớp (classCode). */
  @PostMapping("/classes/join")
  public Map<String, Object> join(@Valid @RequestBody StudentDtos.JoinClassRequest req) {
    return studentService.joinClass(req);
  }

  /** Danh sách buổi học (session) của 1 lớp. */
  @GetMapping("/classes/{classId}/sessions")
  public List<Map<String, Object>> sessions(@PathVariable Long classId) {
    return studentService.getSessionsInClass(classId);
  }

  /** Lịch sử điểm danh của sinh viên trong 1 lớp. */
  @GetMapping("/classes/{classId}/attendance-history")
  public List<Map<String, Object>> attendanceHistoryInClass(@PathVariable Long classId) {
    return studentService.getAttendanceHistoryInClass(classId);
  }
}
