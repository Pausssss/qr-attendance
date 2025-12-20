package com.domain.entity;

import com.domain.enums.SessionStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Bảng Sessions: buổi học/phiên điểm danh của 1 lớp.
 * - status: OPEN/CLOSED
 * - qrToken + qrTokenExpiresAt: token QR dùng để sinh viên check-in
 * - teacherLat/teacherLng: vị trí giảng viên tại thời điểm mở QR (nếu có kiểm tra khoảng cách)
 */
@Entity
@Table(name = "Sessions")
public class SessionEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long classId;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private LocalDateTime sessionDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SessionStatus status;

  @Column
  private String qrToken;

  @Column
  private LocalDateTime qrTokenExpiresAt;

  @Column(precision = 10, scale = 7)
  private BigDecimal teacherLat;

  @Column(precision = 10, scale = 7)
  private BigDecimal teacherLng;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  public SessionEntity() {
  }

  public SessionEntity(Long id, Long classId, String title, LocalDateTime sessionDate, SessionStatus status,
                       String qrToken, LocalDateTime qrTokenExpiresAt, BigDecimal teacherLat, BigDecimal teacherLng,
                       LocalDateTime createdAt) {
    this.id = id;
    this.classId = classId;
    this.title = title;
    this.sessionDate = sessionDate;
    this.status = status;
    this.qrToken = qrToken;
    this.qrTokenExpiresAt = qrTokenExpiresAt;
    this.teacherLat = teacherLat;
    this.teacherLng = teacherLng;
    this.createdAt = createdAt;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getClassId() {
    return classId;
  }

  public void setClassId(Long classId) {
    this.classId = classId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public LocalDateTime getSessionDate() {
    return sessionDate;
  }

  public void setSessionDate(LocalDateTime sessionDate) {
    this.sessionDate = sessionDate;
  }

  public SessionStatus getStatus() {
    return status;
  }

  public void setStatus(SessionStatus status) {
    this.status = status;
  }

  public String getQrToken() {
    return qrToken;
  }

  public void setQrToken(String qrToken) {
    this.qrToken = qrToken;
  }

  public LocalDateTime getQrTokenExpiresAt() {
    return qrTokenExpiresAt;
  }

  public void setQrTokenExpiresAt(LocalDateTime qrTokenExpiresAt) {
    this.qrTokenExpiresAt = qrTokenExpiresAt;
  }

  public BigDecimal getTeacherLat() {
    return teacherLat;
  }

  public void setTeacherLat(BigDecimal teacherLat) {
    this.teacherLat = teacherLat;
  }

  public BigDecimal getTeacherLng() {
    return teacherLng;
  }

  public void setTeacherLng(BigDecimal teacherLng) {
    this.teacherLng = teacherLng;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
