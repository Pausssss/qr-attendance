package com.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ nghiệp vụ dùng để trả về lỗi API theo chuẩn:
 * - status: HTTP status cần trả về
 * - message: thông điệp lỗi
 */
public class ApiException extends RuntimeException {

  private final HttpStatus status;

  public ApiException(HttpStatus status, String message) {
    super(message);
    this.status = status;
  }

  public HttpStatus getStatus() {
    return status;
  }
}
