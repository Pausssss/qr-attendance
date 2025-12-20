package com.api.dto;

import jakarta.validation.constraints.NotBlank;

public class StudentDtos {
  public record JoinClassRequest(@NotBlank String classCode) {}
}
