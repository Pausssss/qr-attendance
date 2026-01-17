package com.service;

import com.api.dto.AuthDtos;
import com.domain.entity.User;
import com.repo.UserRepository;
import com.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * AuthService
 *
 * Ứng dụng này dùng JWT để bảo vệ API.
 * Việc đăng nhập (lấy JWT) hiện đang thực hiện qua Google (xem GoogleAuthService).
 *
 * AuthService chỉ giữ các hàm tiện ích liên quan đến:
 * - Lấy thông tin user hiện tại (/api/auth/me)
 * - Mapping entity -> DTO trả về cho client
 */
@Service
public class AuthService {

  private final UserRepository userRepository;

  public AuthService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Trả về thông tin user hiện tại (lấy từ SecurityContext - JWT Filter đã gắn vào).
   */
  public AuthDtos.UserResponse me() {
    UserPrincipal principal = requirePrincipal();
    User user = userRepository.findById(principal.getId())
        .orElseThrow(() -> new RuntimeException("User not found"));
    return toUserResponse(user);
  }

  /** Map entity -> UserResponse */
  public static AuthDtos.UserResponse toUserResponse(User user) {
    return new AuthDtos.UserResponse(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        user.getRole()
    );
  }

  /** Map entity + token -> AuthResponse */
  public static AuthDtos.AuthResponse toAuthResponse(User user, String token) {
    return new AuthDtos.AuthResponse(toUserResponse(user), token);
  }

  /**
   * Lấy principal (thông tin user) từ SecurityContext.
   * Nếu không hợp lệ => ném lỗi Runtime (GlobalExceptionHandler sẽ handle).
   */
  private static UserPrincipal requirePrincipal() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || auth.getPrincipal() == null) {
      throw new RuntimeException("Unauthenticated");
    }

    Object principal = auth.getPrincipal();
    if (principal instanceof UserPrincipal up) {
      return up;
    }

    throw new RuntimeException("Invalid principal");
  }
}
