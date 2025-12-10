import React, { createContext, useContext, useState } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('qr_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('qr_token', res.data.token);
      localStorage.setItem('qr_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', payload);
      localStorage.setItem('qr_token', res.data.token);
      localStorage.setItem('qr_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Google login
  const loginWithGoogle = async (idToken, role) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/google', { idToken, role });
      localStorage.setItem('qr_token', res.data.token);
      localStorage.setItem('qr_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('qr_token');
    localStorage.removeItem('qr_user');
    setUser(null);
  };

  const value = { user, loading, login, register, loginWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
