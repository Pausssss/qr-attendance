
package com.api.controller;

import com.api.dto.AttendanceDtos;
import com.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API điểm danh (sinh viên): check-in bằng QR.
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

  private final AttendanceService attendanceService;

  public AttendanceController(AttendanceService attendanceService) {
    this.attendanceService = attendanceService;
  }

  @PostMapping("/check-in")
  @PreAuthorize("hasRole('STUDENT')")
  public Map<String, Object> checkIn(@Valid @RequestBody AttendanceDtos.CheckInRequest req) {
    return attendanceService.checkIn(req);
  }
}
