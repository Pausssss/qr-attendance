package com.domain.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Bảng ClassMembers: danh sách sinh viên tham gia lớp.
 * Unique (classId, studentId) để tránh join trùng.
 */
@Entity
@Table(
    name = "ClassMembers",
    uniqueConstraints = {@UniqueConstraint(name = "uq_class_student", columnNames = {"classId", "studentId"})}
)
public class ClassMember {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long classId;

  @Column(nullable = false)
  private Long studentId;

  @Column(nullable = false)
  private LocalDateTime joinedAt;

  public ClassMember() {
  }

  public ClassMember(Long id, Long classId, Long studentId, LocalDateTime joinedAt) {
    this.id = id;
    this.classId = classId;
    this.studentId = studentId;
    this.joinedAt = joinedAt;
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

  public Long getStudentId() {
    return studentId;
  }

  public void setStudentId(Long studentId) {
    this.studentId = studentId;
  }

  public LocalDateTime getJoinedAt() {
    return joinedAt;
  }

  public void setJoinedAt(LocalDateTime joinedAt) {
    this.joinedAt = joinedAt;
  }
}
