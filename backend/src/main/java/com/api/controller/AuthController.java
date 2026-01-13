package com.api.controller;

import com.api.dto.AuthDtos;
import com.service.AuthService;
import com.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.domain.enums.Role;

/**
 * API xác thực/đăng nhập:
 * - POST /api/auth/google: đăng nhập Google (frontend gửi Google ID token)
 * - GET  /api/auth/me: lấy thông tin user hiện tại (đã đăng nhập)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final GoogleAuthService googleAuthService;

  public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
    this.authService = authService;
    this.googleAuthService = googleAuthService;
  }

  /**
   * Frontend gửi Google ID token bằng POST body (khuyến nghị)
   * POST /api/auth/google
   */
  @PostMapping("/google")
  public AuthDtos.AuthResponse google(@Valid @RequestBody AuthDtos.GoogleLoginRequest req) {
    return googleAuthService.loginWithGoogle(req);
  }

  /**
   * Hỗ trợ fallback bằng query param (tránh breaking với code cũ)
   * GET /api/auth/google?credential=...&role=STUDENT
   */
  @GetMapping("/google")
  public AuthDtos.AuthResponse googleGet(
      @RequestParam("credential") String credential,
      @RequestParam(value = "role", required = false) Role role
  ) {
    return googleAuthService.loginWithGoogle(new AuthDtos.GoogleLoginRequest(credential, role));
  }

  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  public AuthDtos.UserResponse me() {
    return authService.me();
  }
}
