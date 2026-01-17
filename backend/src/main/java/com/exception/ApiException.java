package com.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ nghiệp vụ dùng để trả về lỗi API theo chuẩn:
 * - status: HTTP status cần trả về
 * - message: thông điệp lỗi
 */
public class ApiException extends RuntimeException {

  private final HttpStatus status;
  private final java.util.Map<String, Object> details;

  public ApiException(HttpStatus status, String message) {
    super(message);
    this.status = status;
    this.details = null;
  }

  /**
   * Cho phép đính kèm dữ liệu bổ sung trong response lỗi.
   * Ví dụ: distanceMeters, maxDistanceMeters...
   */
  public ApiException(HttpStatus status, String message, java.util.Map<String, Object> details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public java.util.Map<String, Object> getDetails() {
    return details;
  }
}
