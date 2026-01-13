import React, { useState } from "react";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  const [role, setRole] = useState("STUDENT");

  return (
    <div className="card" style={{ maxWidth: 520, margin: "28px auto" }}>
      <div className="card-title">
        <h2 style={{ margin: 0 }}>Đăng nhập</h2>
        <span className="chip chip-primary">
          <span className="dot" /> QR Attendance
        </span>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        Chọn vai trò rồi đăng nhập bằng Google.
      </p>

      <div className="form" style={{ marginTop: 10 }}>
        <div>
          <label>Vai trò</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="STUDENT">Sinh viên</option>
            <option value="TEACHER">Giảng viên</option>
          </select>
        </div>

        <div>
          <GoogleLoginButton role={role} />
        </div>

        <p className="small" style={{ margin: 0 }}>
          * Đăng nhập lần đầu hệ thống sẽ tự tạo tài khoản theo email Google.
        </p>
      </div>
    </div>
  );
}
