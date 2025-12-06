// File: qr-attendance-frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="navbar">
      <div className="logo">
        <Link to="/">QRClass</Link>
      </div>
      <div>
        {user ? (
          <>
            {user.role === 'TEACHER' && (
              <>
                <Link to="/teacher">Lớp của tôi</Link>
              </>
            )}
            {user.role === 'STUDENT' && (
              <>
                <Link to="/student">Lớp của tôi</Link>
                <Link to="/student/scan">Quét QR</Link>
              </>
            )}
            <span style={{ margin: '0 1rem' }}>{user.fullName}</span>
            <button className="secondary" onClick={logout}>
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Đăng nhập</Link>
            <Link to="/register">Đăng ký</Link>
          </>
        )}
      </div>
    </div>
  );
}
