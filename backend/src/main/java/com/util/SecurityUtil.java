
package com.util;

import com.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {
  private SecurityUtil() {}

  public static UserPrincipal currentUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal up)) {
      return null;
    }
    return up;
  }
}
