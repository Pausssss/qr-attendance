package com.security;

import com.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * JWT helper
 * - Secret + expiration lấy từ app.jwt.secret / app.jwt.expiration-ms
 * - Token chứa subject=userId và claims: email, role
 */
@Component
public class JwtUtil {

  private final Key signingKey;
  private final long expirationMs;

  public JwtUtil(AppProperties props) {
    String secret = props.getJwt().getSecret();
    secret = normalizeSecret(secret);
    this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

    this.expirationMs = props.getJwt().getExpirationMs() > 0
        ? props.getJwt().getExpirationMs()
        : 604800000L; // 7 days
  }

  /** HS256 cần key >= 256-bit (~32 bytes). */
  private static String normalizeSecret(String secret) {
    String s = (secret == null) ? "" : secret.trim();
    if (s.isEmpty()) {
      s = "CHANGE_ME_CHANGE_ME_CHANGE_ME_CHANGE_ME_32CHARS";
    }
    if (s.length() < 32) {
      // lặp lại cho đủ dài để tránh crash khi chạy demo
      StringBuilder sb = new StringBuilder();
      while (sb.length() < 32) sb.append(s);
      s = sb.substring(0, 32);
    }
    return s;
  }

  public String generateToken(Long userId, String email, String role) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + expirationMs);

    return Jwts.builder()
        .setSubject(String.valueOf(userId))
        .claim("email", email)
        .claim("role", role)
        .setIssuedAt(now)
        .setExpiration(expiry)
        .signWith(signingKey)
        .compact();
  }

  /** Kiểm tra token hợp lệ hay không */
  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder()
          .setSigningKey(signingKey)
          .build()
          .parseClaimsJws(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  /** Lấy thông tin user từ token */
  public UserPrincipal getUserFromToken(String token) {
    Claims claims = Jwts.parserBuilder()
        .setSigningKey(signingKey)
        .build()
        .parseClaimsJws(token)
        .getBody();

    Long userId = Long.parseLong(claims.getSubject());
    String email = claims.get("email", String.class);
    String role = claims.get("role", String.class);

    return new UserPrincipal(userId, email, role);
  }
}
