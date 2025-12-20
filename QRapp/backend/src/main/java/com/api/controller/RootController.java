
package com.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * API kiểm tra hệ thống (health/simple message).
 */
@RestController
public class RootController {
  @GetMapping("/")
  public Map<String, Object> root() {
    return Map.of("message", "QR Attendance API");
  }
}
