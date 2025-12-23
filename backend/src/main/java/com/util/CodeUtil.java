
package com.util;

import java.security.SecureRandom;

public class CodeUtil {
  private static final String ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static final SecureRandom RND = new SecureRandom();

  private CodeUtil() {}

  public static String generateClassCode() {
    // mimic Node generateCode: usually 6-8 chars; use 6.
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < 6; i++) sb.append(ALPHANUM.charAt(RND.nextInt(ALPHANUM.length())));
    return sb.toString();
  }

  public static String randomToken(int length) {
    String chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < length; i++) sb.append(chars.charAt(RND.nextInt(chars.length())));
    return sb.toString();
  }
}
