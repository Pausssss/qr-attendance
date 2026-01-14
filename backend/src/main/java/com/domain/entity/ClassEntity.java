package com.domain.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Bảng Classes: lớp học do giảng viên tạo.
 * - code: mã lớp (unique) để sinh viên tham gia.
 */
@Entity
@Table(name = "Classes", uniqueConstraints = {
    @UniqueConstraint(name = "uq_teacher_classname_norm", columnNames = {"teacherId", "normalizedName"})
})
public class ClassEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String className;

  /**
   * Tên lớp đã chuẩn hoá (lowercase + trim + gộp khoảng trắng) để check trùng.
   */
  @Column(nullable = false)
  private String normalizedName;

  @Column(nullable = false, unique = true)
  private String code;

  @Column(nullable = false)
  private Long teacherId;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  public ClassEntity() {
  }

  public ClassEntity(Long id, String className, String code, Long teacherId, LocalDateTime createdAt) {
    this.id = id;
    this.className = className;
    this.code = code;
    this.teacherId = teacherId;
    this.createdAt = createdAt;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getClassName() {
    return className;
  }

  public void setClassName(String className) {
    this.className = className;
  }

  public String getNormalizedName() {
    return normalizedName;
  }

  public void setNormalizedName(String normalizedName) {
    this.normalizedName = normalizedName;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public Long getTeacherId() {
    return teacherId;
  }

  public void setTeacherId(Long teacherId) {
    this.teacherId = teacherId;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
