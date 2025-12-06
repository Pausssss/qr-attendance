// File: qr-attendance-frontend/src/pages/teacher/TeacherDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadClasses = async () => {
    const res = await api.get('/api/teacher/classes');
    setClasses(res.data);
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setLoading(true);
      setMessage('');
      await api.post('/api/teacher/classes', { className: newClassName.trim() });
      setNewClassName('');
      await loadClasses();
      setMessage('Tạo lớp thành công!');
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || 'Không thể tạo lớp, vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Trang giáo viên</h2>

      <div className="card">
        <h3>Tạo lớp mới</h3>
        <form onSubmit={handleCreateClass}>
          <input
            placeholder="Tên lớp (VD: Lập trình Web 1)"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <button type="submit" disabled={loading} style={{ marginLeft: '0.5rem' }}>
            {loading ? 'Đang tạo...' : 'Tạo lớp'}
          </button>
        </form>
        {message && <p style={{ marginTop: '0.5rem' }}>{message}</p>}
      </div>

      <div className="card">
        <h3>Danh sách lớp</h3>
        {classes.map((c) => (
          <div key={c.id} style={{ marginBottom: '0.5rem' }}>
            <Link to={`/teacher/classes/${c.id}`}>
              {c.className} (Mã: {c.code})
            </Link>
          </div>
        ))}
        {classes.length === 0 && <p>Chưa có lớp nào, hãy tạo lớp mới.</p>}
      </div>
    </div>
  );
}
