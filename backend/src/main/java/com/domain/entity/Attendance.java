package com.domain.entity;

import com.domain.enums.AttendanceStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Bảng Attendance: lưu thông tin điểm danh của 1 sinh viên trong 1 buổi học (session).
 * Ràng buộc unique (sessionId, studentId) để 1 sinh viên không điểm danh 2 lần cho cùng session.
 */
@Entity
@Table(
    name = "Attendance",
    uniqueConstraints = {@UniqueConstraint(name = "uq_session_student", columnNames = {"sessionId", "studentId"})}
)
public class Attendance {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long sessionId;

  @Column(nullable = false)
  private Long studentId;

  @Column
  private LocalDateTime checkInTime;

  @Column(precision = 10, scale = 7)
  private BigDecimal gpsLat;

  @Column(precision = 10, scale = 7)
  private BigDecimal gpsLng;

  @Column(length = 1024)
  private String photoUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AttendanceStatus status;

  // JPA cần constructor rỗng
  public Attendance() {
  }

  public Attendance(Long id, Long sessionId, Long studentId, LocalDateTime checkInTime,
                    BigDecimal gpsLat, BigDecimal gpsLng, String photoUrl, AttendanceStatus status) {
    this.id = id;
    this.sessionId = sessionId;
    this.studentId = studentId;
    this.checkInTime = checkInTime;
    this.gpsLat = gpsLat;
    this.gpsLng = gpsLng;
    this.photoUrl = photoUrl;
    this.status = status;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getSessionId() {
    return sessionId;
  }

  public void setSessionId(Long sessionId) {
    this.sessionId = sessionId;
  }

  public Long getStudentId() {
    return studentId;
  }

  public void setStudentId(Long studentId) {
    this.studentId = studentId;
  }

  public LocalDateTime getCheckInTime() {
    return checkInTime;
  }

  public void setCheckInTime(LocalDateTime checkInTime) {
    this.checkInTime = checkInTime;
  }

  public BigDecimal getGpsLat() {
    return gpsLat;
  }

  public void setGpsLat(BigDecimal gpsLat) {
    this.gpsLat = gpsLat;
  }

  public BigDecimal getGpsLng() {
    return gpsLng;
  }

  public void setGpsLng(BigDecimal gpsLng) {
    this.gpsLng = gpsLng;
  }

  public String getPhotoUrl() {
    return photoUrl;
  }

  public void setPhotoUrl(String photoUrl) {
    this.photoUrl = photoUrl;
  }

  public AttendanceStatus getStatus() {
    return status;
  }

  public void setStatus(AttendanceStatus status) {
    this.status = status;
  }
}
