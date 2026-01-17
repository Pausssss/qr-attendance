import React, { useState } from "react";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  const [role, setRole] = useState("STUDENT");

  return (
    <div className="hero">
      <div className="hero-card">
        <h1 className="hero-title">Đăng nhập</h1>
        <p className="hero-sub">
          Chọn vai trò rồi đăng nhập bằng Google. Nếu đăng nhập lần đầu, hệ thống sẽ
          tự tạo tài khoản dựa trên email Google.
        </p>

        <div className="card" style={{ marginTop: 14 }}>
          <form className="form login-form" onSubmit={(e) => e.preventDefault()}>
            <div className="login-field">
              <label>Vai trò</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="STUDENT">Sinh viên</option>
                <option value="TEACHER">Giảng viên</option>
              </select>
            </div>

            <div className="login-field">
              <label>Đăng nhập</label>
              <GoogleLoginButton role={role} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
