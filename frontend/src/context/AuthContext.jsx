import React, { createContext, useContext, useMemo, useState } from "react";
import api from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("qr_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  /**
   * Google Identity Services trả về JWT ở response.credential.
   * Frontend gửi JWT này lên backend để verify và nhận JWT của hệ thống.
   */
  const loginWithGoogle = async (credential, role) => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/google", {
        idToken: credential,
        role,
      });

      const { token, user: userResp } = res.data || {};
      if (token) localStorage.setItem("qr_token", token);
      if (userResp) {
        localStorage.setItem("qr_user", JSON.stringify(userResp));
        setUser(userResp);
      }
      return userResp;
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
