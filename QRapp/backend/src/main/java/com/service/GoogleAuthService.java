package com.service;

import com.api.dto.AuthDtos;
import com.config.AppProperties;
import com.domain.entity.User;
import com.domain.enums.Role;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.repo.UserRepository;
import com.security.JwtUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;

/**
 * Xác thực bằng Google ID Token (frontend lấy từ Google Identity Services)
 * - Verify token với clientId cấu hình ở app.google.client-id (hoặc env GOOGLE_CLIENT_ID)
 * - Nếu user chưa có -> tạo user mới (mặc định STUDENT hoặc role frontend gửi lên)
 * - Trả về JWT để gọi API
 */
@Service
public class GoogleAuthService {

  private final UserRepository userRepository;
  private final JwtUtil jwtUtil;
  private final String googleClientId;

  public GoogleAuthService(UserRepository userRepository, JwtUtil jwtUtil, AppProperties props) {
    this.userRepository = userRepository;
    this.jwtUtil = jwtUtil;

    // props.getGoogle().getClientId() sẽ lấy từ: app.google.client-id
    // Trong Render nên set env: GOOGLE_CLIENT_ID (đã map trong application.yml)
    this.googleClientId = props.getGoogle() != null ? props.getGoogle().getClientId() : null;
  }

  public AuthDtos.AuthResponse loginWithGoogle(AuthDtos.GoogleLoginRequest req) {
    if (googleClientId == null || googleClientId.isBlank()) {
      throw new RuntimeException("Missing GOOGLE_CLIENT_ID (app.google.client-id)");
    }

    String idTokenString = req.idToken();

    try {
      GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
          new NetHttpTransport(),
          JacksonFactory.getDefaultInstance()
      ).setAudience(Collections.singletonList(googleClientId)).build();

      GoogleIdToken idToken = verifier.verify(idTokenString);
      if (idToken == null) {
        throw new RuntimeException("Invalid Google token");
      }

      GoogleIdToken.Payload payload = idToken.getPayload();

      String email = payload.getEmail();
      String fullName = (String) payload.get("name");
      String googleId = payload.getSubject(); // stable ID for this Google account

      // Ưu tiên tìm theo googleId, fallback theo email
      User user = userRepository.findByGoogleId(googleId)
          .orElseGet(() -> userRepository.findByEmail(email).orElse(null));

      if (user == null) {
        Role role = req.role() != null ? req.role() : Role.STUDENT;

        user = new User();
        user.setFullName(fullName != null ? fullName : email);
        user.setEmail(email);
        user.setRole(role);
        user.setGoogleId(googleId);
        user.setCreatedAt(LocalDateTime.now());

        user = userRepository.save(user);
      } else {
        // sync basic info nếu cần
        boolean changed = false;
        if (user.getGoogleId() == null || user.getGoogleId().isBlank()) {
          user.setGoogleId(googleId);
          changed = true;
        }
        if (fullName != null && !fullName.isBlank() && !fullName.equals(user.getFullName())) {
          user.setFullName(fullName);
          changed = true;
        }
        if (changed) {
          user = userRepository.save(user);
        }
      }

      String token = jwtUtil.generateToken(
          user.getId(),
          user.getEmail(),
          user.getRole().name()
      );

      return AuthService.toAuthResponse(user, token);

    } catch (Exception e) {
      throw new RuntimeException("Google authentication failed: " + e.getMessage(), e);
    }
  }
}
