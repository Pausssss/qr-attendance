package com.config;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupRunner implements ApplicationRunner {

  private final AppProperties props;

  public StartupRunner(AppProperties props) {
    this.props = props;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    String dir = (props.getUpload() != null) ? props.getUpload().getDir() : null;

    if (dir == null || dir.isBlank()) {
      dir = "uploads"; // default để không null
    }

    Path uploadPath = Path.of(dir).toAbsolutePath().normalize();
    Files.createDirectories(uploadPath);

    System.out.println("✅ Upload dir: " + uploadPath);
  }
}
