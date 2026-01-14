package com.repo;

import com.domain.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
  List<ClassEntity> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);
  Optional<ClassEntity> findByCode(String code);
  boolean existsByTeacherIdAndNormalizedName(Long teacherId, String normalizedName);
  boolean existsByTeacherIdAndNormalizedNameAndIdNot(Long teacherId, String normalizedName, Long id);
}

