package com.domain.enums;

public enum AttendanceStatus {
  ON_TIME,
  LATE,
  /** Giảng viên điểm danh thủ công (fallback khi SV không có thiết bị/GPS lỗi). */
  MANUAL,
  ABSENT
}
