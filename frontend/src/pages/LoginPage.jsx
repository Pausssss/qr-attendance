import React, { useState } from "react";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  const [role, setRole] = useState("STUDENT");

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>Đăng nhập bằng Google</h2>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Chọn vai trò (nếu có) rồi đăng nhập.
      </p>

      <label style={{ display: "block", marginBottom: 6 }}>Vai trò</label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
      >
        <option value="STUDENT">Sinh viên</option>
        <option value="TEACHER">Giảng viên</option>
      </select>

      <GoogleLoginButton role={role} />

      <p style={{ fontSize: 12, opacity: 0.7 }}>
        * Nếu bạn đăng nhập lần đầu, hệ thống sẽ tự tạo tài khoản dựa trên email Google.
      </p>
    </div>
  );
}
