package com;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

import java.util.TimeZone;

@SpringBootApplication
@ConfigurationPropertiesScan("com.config")
public class QrAttendanceApplication {
    public static void main(String[] args) {
        // Render thường chạy UTC. Set timezone VN để giờ điểm danh & tính phút đúng.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SpringApplication.run(QrAttendanceApplication.class, args);
    }
}
