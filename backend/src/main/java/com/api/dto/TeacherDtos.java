package com.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class TeacherDtos {
  public record CreateClassRequest(@NotBlank String className) {}
  public record UpdateClassRequest(@NotBlank String className) {}

  public record CreateSessionRequest(
      @NotBlank String title,
      @NotNull LocalDateTime sessionDate
  ) {}

  public record OpenSessionRequest(
      @NotNull Double teacherLat,
      @NotNull Double teacherLng
  ) {}

  /** Giảng viên điểm danh thủ công cho 1 sinh viên trong 1 buổi học. */
  public record ManualAttendanceRequest(
      @NotNull Long studentId,
      String note
  ) {}
}
