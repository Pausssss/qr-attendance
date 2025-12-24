import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="navbar">
      <div className="wrap">
        <Link to="/" className="brand">
          <span className="dot" />
          QRClass
        </Link>

        <nav className="nav-links">
          {user ? (
            <>
              {user.role === "TEACHER" && <Link to="/teacher">Giảng viên</Link>}
              {user.role === "STUDENT" && (
                <>
                  <Link to="/student">Sinh viên</Link>
                  <Link to="/student/scan">Quét QR</Link>
                </>
              )}
              <button onClick={logout} disabled={loading}>
                Đăng xuất
              </button>
              <div className="nav-user">
                <div className="avatar" title={user.email} />
              </div>
            </>
          ) : (
            <>
              <Link to="/login">Đăng nhập</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
