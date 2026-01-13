import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getInitial(user) {
  const name = user?.fullName || user?.name || "";
  const email = user?.email || "";
  const s = (name || email).trim();
  return s ? s[0].toUpperCase() : "U";
}

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="wrap">
        <Link to="/" className="brand">
          <span className="dot" aria-hidden="true" />
          <span>QRClass</span>
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

              <div className="nav-user">
                <div className="avatar" title={user.fullName || user.email}>
                  <span style={{ fontWeight: 900, fontSize: 13 }}>
                    {getInitial(user)}
                  </span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={logout}>
                  Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <Link to="/login">Đăng nhập</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
