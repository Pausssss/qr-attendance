package com.repo;

import com.domain.entity.SessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository thao tác với bảng SessionEntity (buổi học).
 *
 * Spring Data JPA tự sinh query theo tên hàm.
 */
public interface SessionRepository extends JpaRepository<SessionEntity, Long> {

  /** Lấy danh sách buổi học của 1 lớp (mới nhất trước). */
  List<SessionEntity> findByClassIdOrderBySessionDateDesc(Long classId);

  /** Lấy danh sách buổi học của 1 lớp (cũ nhất trước). */
  List<SessionEntity> findByClassIdOrderBySessionDateAsc(Long classId);
  // List sessions by class (unordered)
  List<SessionEntity> findByClassId(Long classId);

  // Delete sessions by class
  void deleteByClassId(Long classId);

}
