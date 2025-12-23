package com.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
/**
 * Cấu hình ứng dụng đọc từ application.yml / application.properties
 * Ví dụ:
 * app.jwt.secret=...
 * app.jwt.expirationMs=...
 * app.cors.origins=...
 * app.google.clientId=...
 * app.attendance.onTimeMinutes=...
 * app.upload.dir=...
 */
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

  private Jwt jwt = new Jwt();
  private Cors cors = new Cors();
  private Google google = new Google();
  private Attendance attendance = new Attendance();
  private Upload upload = new Upload();

  public Jwt getJwt() {
    return jwt;
  }

  public void setJwt(Jwt jwt) {
    this.jwt = jwt;
  }

  public Cors getCors() {
    return cors;
  }

  public void setCors(Cors cors) {
    this.cors = cors;
  }

  public Google getGoogle() {
    return google;
  }

  public void setGoogle(Google google) {
    this.google = google;
  }

  public Attendance getAttendance() {
    return attendance;
  }

  public void setAttendance(Attendance attendance) {
    this.attendance = attendance;
  }

  public Upload getUpload() {
    return upload;
  }

  public void setUpload(Upload upload) {
    this.upload = upload;
  }

  public static class Jwt {
    private String secret;
    private long expirationMs;

    public String getSecret() {
      return secret;
    }

    public void setSecret(String secret) {
      this.secret = secret;
    }

    public long getExpirationMs() {
      return expirationMs;
    }

    public void setExpirationMs(long expirationMs) {
      this.expirationMs = expirationMs;
    }
  }

  public static class Cors {
    /** Danh sách origin cho phép (phân tách bằng dấu phẩy) */
    private String origins;

    public String getOrigins() {
      return origins;
    }

    public void setOrigins(String origins) {
      this.origins = origins;
    }
  }

  public static class Google {
    private String clientId;

    public String getClientId() {
      return clientId;
    }

    public void setClientId(String clientId) {
      this.clientId = clientId;
    }
  }

  public static class Attendance {
    /** Số phút được coi là "đúng giờ" (<= onTimeMinutes) */
    private int onTimeMinutes;

    public int getOnTimeMinutes() {
      return onTimeMinutes;
    }

    public void setOnTimeMinutes(int onTimeMinutes) {
      this.onTimeMinutes = onTimeMinutes;
    }
  }

  public static class Upload {
    /** Thư mục lưu ảnh upload (ví dụ: uploads/) */
    private String dir;

    public String getDir() {
      return dir;
    }

    public void setDir(String dir) {
      this.dir = dir;
    }
  }
}
