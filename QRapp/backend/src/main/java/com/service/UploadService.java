
package com.service;

import com.config.AppProperties;
import com.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@Service

/**
 * Service upload file (ảnh minh chứng):
 * - Nhận MultipartFile
 * - Lưu vào thư mục cấu hình (app.upload.dir)
 * - Trả về URL/đường dẫn cho client
 */
public class UploadService {

  private final AppProperties props;

  public UploadService(AppProperties props) {
    this.props = props;
  }

  public Map<String, Object> uploadPhoto(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "No file uploaded");
    }

    String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "photo" : file.getOriginalFilename());
    String ext = "";
    int idx = original.lastIndexOf('.');
    if (idx >= 0) ext = original.substring(idx);

    String filename = UUID.randomUUID() + ext;
    Path uploadDir = Path.of(props.getUpload().getDir()).toAbsolutePath().normalize();
    Path dest = uploadDir.resolve(filename);

    try {
      Files.createDirectories(uploadDir);
      file.transferTo(dest);
    } catch (IOException e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Upload failed");
    }

    String photoUrl = "/uploads/" + filename;
    return Map.of("photoUrl", photoUrl);
  }
}
