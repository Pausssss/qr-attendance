package com.domain.entity;

import com.domain.enums.Role;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Bảng Users: tài khoản trong hệ thống.
 * - role: TEACHER / STUDENT (tuỳ enum Role của bạn)
 * - passwordHash: dùng cho đăng nhập email/password
 * - googleId: dùng cho đăng nhập Google OAuth
 */
@Entity
@Table(name = "Users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String fullName;

  @Column(nullable = false, unique = true)
  private String email;

  @Column
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @Column
  private String googleId;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  public User() {
  }

  public User(Long id, String fullName, String email, String passwordHash, Role role, String googleId, LocalDateTime createdAt) {
    this.id = id;
    this.fullName = fullName;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.googleId = googleId;
    this.createdAt = createdAt;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public String getGoogleId() {
    return googleId;
  }

  public void setGoogleId(String googleId) {
    this.googleId = googleId;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
