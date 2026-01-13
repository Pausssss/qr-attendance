import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
            {user.role === "TEACHER" && <Link to="/teacher">Giảng viên</Link>}
            {user.role === "STUDENT" && (<>
              <Link to="/student">Sinh viên</Link>
              <Link to="/student/scan" style={{ marginLeft: 12 }}>Quét QR</Link>
            </>)}
            <button className="secondary" onClick={logout}>
              Đăng xuất
            </button>
          </>
        ) : (
          <Link to="/login">Đăng nhập</Link>
        )}
      </div>
    </div>
  );
}
