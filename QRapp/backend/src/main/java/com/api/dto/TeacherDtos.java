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
}
