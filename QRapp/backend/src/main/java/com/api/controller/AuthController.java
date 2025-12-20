package com.api.controller;

import com.api.dto.AuthDtos;
import com.service.AuthService;
import com.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * API xác thực/đăng nhập:
 * - /login: đăng nhập email/password
 * - /google: đăng nhập Google
 * - /me: lấy thông tin user hiện tại
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

  @PostMapping("/google")
  public AuthDtos.AuthResponse google(@Valid @RequestBody AuthDtos.GoogleLoginRequest req) {
    return googleAuthService.loginWithGoogle(req);
  }

  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  public AuthDtos.UserResponse me() {
    return authService.me();
  }
}
