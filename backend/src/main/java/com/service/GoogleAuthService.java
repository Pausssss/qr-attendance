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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

  public GoogleAuthService(
      UserRepository userRepository,
      JwtUtil jwtUtil,
      AppProperties props
  ) {
    this.userRepository = userRepository;
    this.jwtUtil = jwtUtil;

    // props.getGoogle().getClientId() sẽ lấy từ: app.google.client-id
    // Trong Render nên set env: GOOGLE_CLIENT_ID (đã map trong application.yml)
    this.googleClientId = props.getGoogle() != null ? props.getGoogle().getClientId() : null;
  }

  /**
   * Login bằng Google ID Token.
   * Frontend gửi lên body: { idToken, role? }
   */
  public AuthDtos.AuthResponse loginWithGoogle(AuthDtos.GoogleLoginRequest req) {

    String credential = req.idToken();

    if (googleClientId == null || googleClientId.isBlank()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Missing GOOGLE_CLIENT_ID"
      );
    }

    try {
      GoogleIdTokenVerifier verifier =
          new GoogleIdTokenVerifier.Builder(
              new NetHttpTransport(),
              JacksonFactory.getDefaultInstance()
          )
          .setAudience(Collections.singletonList(googleClientId))
          .build();

      GoogleIdToken idToken = verifier.verify(credential);
      if (idToken == null) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Invalid Google token"
        );
      }

      GoogleIdToken.Payload payload = idToken.getPayload();

      String email = payload.getEmail();
      String fullName = (String) payload.get("name");
      String googleId = payload.getSubject();

      User user = userRepository.findByGoogleId(googleId)
          .orElseGet(() -> userRepository.findByEmail(email).orElse(null));

      if (user == null) {
        // Tạo user mới
        Role role = (req.role() != null) ? req.role() : Role.STUDENT;
        user = new User();
        user.setEmail(email);
        user.setFullName(fullName != null ? fullName : email);
        user.setRole(role);
        user.setGoogleId(googleId);
        user.setCreatedAt(LocalDateTime.now());

        user = userRepository.save(user);
      } else {
        boolean changed = false;
        if (user.getGoogleId() == null) {
          user.setGoogleId(googleId);
          changed = true;
        }
        if (fullName != null && !fullName.equals(user.getFullName())) {
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

    } catch (ResponseStatusException e) {
      throw e;
    } catch (Exception e) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Google authentication failed"
      );
    }
  }

  /**
   * Backward compatible: nhận credential + role từ query param.
   */
  public AuthDtos.AuthResponse loginWithGoogle(String credential, Role role) {
    return loginWithGoogle(new AuthDtos.GoogleLoginRequest(credential, role));
  }
}
