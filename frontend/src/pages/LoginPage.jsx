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

        <div className="card mt-3">
          <form className="form" onSubmit={(e) => e.preventDefault()}>
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
          </form>
        </div>
      </div>
    </div>
  );
}
