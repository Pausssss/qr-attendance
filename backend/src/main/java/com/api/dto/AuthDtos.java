package com.api.dto;

import com.domain.enums.Role;
import jakarta.validation.constraints.NotBlank;

/**
 * DTOs cho Auth (Google-only)
 */
public class AuthDtos {

  /** idToken là Google ID Token nhận từ Google Identity Services */
  public record GoogleLoginRequest(
      @NotBlank String idToken,
      Role role // optional (STUDENT/TEACHER)
  ) {}

  public record UserResponse(
      Long id,
      String fullName,
      String email,
      Role role
  ) {}

  public record AuthResponse(
      UserResponse user,
      String token
  ) {}
}
