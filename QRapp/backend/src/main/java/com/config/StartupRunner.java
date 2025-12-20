
package com.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class StartupRunner implements CommandLineRunner {

  private final AppProperties props;

  public StartupRunner(AppProperties props) {
    this.props = props;
  }

  @Override
  public void run(String... args) throws Exception {
    Path uploadDir = Path.of(props.getUpload().getDir()).toAbsolutePath().normalize();
    Files.createDirectories(uploadDir);
  }
}
