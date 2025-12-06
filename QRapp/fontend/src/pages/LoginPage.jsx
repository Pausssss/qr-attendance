// File: fontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [googleRole, setGoogleRole] = useState('STUDENT');

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'TEACHER') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Đăng nhập</h2>

      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.9rem' }}>Bạn là:</label>
        <select
          value={googleRole}
          onChange={(e) => setGoogleRole(e.target.value)}
          style={{ marginLeft: '0.5rem' }}
        >
          <option value="STUDENT">Sinh viên</option>
          <option value="TEACHER">Giáo viên</option>
        </select>
      </div>

      <GoogleLoginButton role={googleRole} />

      <hr style={{ margin: '1rem 0' }} />

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input name="email" value={form.email} onChange={onChange} />
        <label>Mật khẩu</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
        />
        <button disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}
