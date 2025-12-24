import React, { useState } from "react";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  const [role, setRole] = useState("STUDENT");

  return (
    <div style={{ maxWidth: 520, margin: "24px auto" }}>
      <div className="hero-card">
        <h2 className="hero-title">Đăng nhập bằng Google</h2>
        <p className="hero-sub">Chọn vai trò rồi bấm đăng nhập.</p>

        <div className="spacer" />

        <label>Vai trò</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="STUDENT">Sinh viên</option>
          <option value="TEACHER">Giảng viên</option>
        </select>

        <div className="spacer" />
        <GoogleLoginButton role={role} />

        <p className="small" style={{ marginTop: 6 }}>
          * Lần đầu đăng nhập: hệ thống sẽ tự tạo tài khoản dựa trên email Google.
        </p>
      </div>
    </div>
  );
}
