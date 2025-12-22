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

  // ✅ FIX: dùng GET + query param credential
  const loginWithGoogle = async (credential, role) => {
    setLoading(true);
    try {
      const res = await api.get("/api/auth/google", {
        params: {
          credential,
          role,
        },
      });

      localStorage.setItem("qr_token", res.data.token);
      localStorage.setItem("qr_user", JSON.stringify(res.data.user));
      setUser(res.data.user);

      return res.data.user;
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
