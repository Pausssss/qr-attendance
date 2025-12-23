
package com.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

  /**
   * Giữ đúng status code khi service chủ động throw ResponseStatusException
   * (ví dụ 400/401/403...), tránh bị handler(Exception) "nuốt" thành 500.
   */
  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, Object>> handle(ResponseStatusException ex) {
    String msg = (ex.getReason() == null || ex.getReason().isBlank())
        ? "Request failed"
        : ex.getReason();
    return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", msg));
  }

  /**
   * Trả đúng 405 khi gọi sai HTTP method (POST/GET...).
   */
  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<Map<String, Object>> handle(HttpRequestMethodNotSupportedException ex) {
    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
        .body(Map.of("message", "Method not allowed"));
  }

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, Object>> handle(ApiException ex) {
    return ResponseEntity.status(ex.getStatus()).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handle(MethodArgumentNotValidException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("message", "Invalid request"));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<Map<String, Object>> handle(ConstraintViolationException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("message", "Invalid request"));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handle(Exception ex) {
    ex.printStackTrace();
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("message", ex.getMessage() == null ? "Internal server error" : ex.getMessage()));
  }
}
