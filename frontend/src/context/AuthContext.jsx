import React, { createContext, useContext, useMemo, useState } from "react";

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

  const loginWithGoogle = () => {
    setLoading(true);
    window.location.href =
      "https://qr-attendance-s4jr.onrender.com/api/auth/google";
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
