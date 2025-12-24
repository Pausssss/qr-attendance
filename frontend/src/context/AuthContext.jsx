import React, { createContext, useContext, useMemo, useState } from "react";
import api from "../api/axiosClient";

/**
 * Auth flow (Google Identity Services):
 * - Frontend nhận credential (Google ID Token)
 * - POST /api/auth/google { idToken, role }
 * - Backend verify + trả JWT + user
 */

const AuthContext = createContext(null);

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("qr_user");
    return raw ? safeJsonParse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  /**
   * @param {string} idToken Google ID Token (credential)
   * @param {"STUDENT"|"TEACHER"} role
   */
  const loginWithGoogle = async (idToken, role) => {
    if (!idToken) throw new Error("Missing Google credential");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/google", {
        idToken,
        role,
      });

      const { token, user: me } = res.data || {};
      if (!token || !me) throw new Error("Invalid auth response");

      localStorage.setItem("qr_token", token);
      localStorage.setItem("qr_user", JSON.stringify(me));
      setUser(me);
      return me;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("qr_token");
    localStorage.removeItem("qr_user");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, loginWithGoogle, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
