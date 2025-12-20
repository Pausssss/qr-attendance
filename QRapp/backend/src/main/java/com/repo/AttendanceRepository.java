package com.repo;

import com.domain.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

  Optional<Attendance> findBySessionIdAndStudentId(Long sessionId, Long studentId);

  // =========================
  // Lấy danh sách điểm danh + thông tin sinh viên trong 1 buổi học
  // =========================
  @Query("""
    SELECT a, u.fullName, u.email
    FROM Attendance a
    JOIN User u ON a.studentId = u.id
    WHERE a.sessionId = :sessionId
    ORDER BY a.checkInTime ASC
  """)
  List<Object[]> findBySessionWithUser(@Param("sessionId") Long sessionId);

  // =========================
  // Lịch sử điểm danh của sinh viên trong 1 lớp
  // =========================
  @Query("""
    SELECT s.id, s.title, s.sessionDate, a.status, a.checkInTime
    FROM SessionEntity s
    LEFT JOIN Attendance a
      ON a.sessionId = s.id AND a.studentId = :studentId
    WHERE s.classId = :classId
    ORDER BY s.sessionDate ASC
  """)
  List<Object[]> findStudentHistoryInClass(
      @Param("studentId") Long studentId,
      @Param("classId") Long classId
  );

  // =========================
  // Lấy danh sách điểm danh theo lớp
  // =========================
  @Query("""
    SELECT a, s.classId, s.title, s.sessionDate
    FROM Attendance a
    JOIN SessionEntity s ON a.sessionId = s.id
    WHERE s.classId = :classId
  """)
  List<Object[]> findByClassWithSession(@Param("classId") Long classId);
}
