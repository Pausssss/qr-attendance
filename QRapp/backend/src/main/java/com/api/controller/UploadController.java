
package com.api.controller;

import com.service.UploadService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * API upload (ảnh minh chứng điểm danh).
 */
@RestController
@RequestMapping("/api/upload")
public class UploadController {

  private final UploadService uploadService;

  public UploadController(UploadService uploadService) {
    this.uploadService = uploadService;
  }

  @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Map<String, Object> upload(@RequestPart("file") MultipartFile file) {
    return uploadService.uploadPhoto(file);
  }
}
