
package com.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class WebMvcConfig implements WebMvcConfigurer {

  private final AppProperties props;

  public WebMvcConfig(AppProperties props) {
    this.props = props;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path uploadDir = Path.of(props.getUpload().getDir()).toAbsolutePath().normalize();
    registry.addResourceHandler("/uploads/**")
        .addResourceLocations(uploadDir.toUri().toString());
  }
}
