package com.repo;

import com.domain.entity.ClassEntity;
import com.domain.entity.ClassMember;
import com.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClassMemberRepository extends JpaRepository<ClassMember, Long> {

  // Kiểm tra sinh viên đã tham gia lớp hay chưa
  boolean existsByClassIdAndStudentId(Long classId, Long studentId);

  Optional<ClassMember> findByClassIdAndStudentId(Long classId, Long studentId);

  // Danh sách lớp mà sinh viên đã tham gia
  @Query("""
    SELECT c, cm.joinedAt
    FROM ClassMember cm
    JOIN ClassEntity c ON cm.classId = c.id
    WHERE cm.studentId = :studentId
    ORDER BY c.createdAt DESC
  """)
  List<Object[]> findJoinedClasses(@Param("studentId") Long studentId);

  // Danh sách thành viên trong 1 lớp (dùng cho giảng viên)
  @Query("""
    SELECT cm, u.fullName, u.email
    FROM ClassMember cm
    JOIN User u ON cm.studentId = u.id
    WHERE cm.classId = :classId
    ORDER BY cm.joinedAt ASC
  """)
  List<Object[]> findMembersByClass(@Param("classId") Long classId);

  // Danh sách sinh viên trong lớp (id + tên + email)
  @Query("""
    SELECT u.id, u.fullName, u.email
    FROM ClassMember cm
    JOIN User u ON cm.studentId = u.id
    WHERE cm.classId = :classId
    ORDER BY u.fullName ASC
  """)
  List<Object[]> findStudentsByClass(@Param("classId") Long classId);
  // Delete all members of a class
  void deleteByClassId(Long classId);

}
