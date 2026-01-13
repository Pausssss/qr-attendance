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
      setMessage(err.response?.data?.message || 'Không thể tạo lớp, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="hero">
        <div className="hero-card">
          <h1 className="hero-title">Trang giảng viên</h1>
          <p className="hero-sub">
            Tạo lớp, quản lý sinh viên, mở/đóng điểm danh và xem báo cáo.
          </p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card col-6">
          <div className="card-title">
            <h3>Tạo lớp mới</h3>
          </div>

          <form onSubmit={handleCreateClass} className="row">
            <input
              className="input"
              placeholder="Tên lớp (VD: Lập trình Web 1)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo lớp'}
            </button>
          </form>

          {message && (
            <div className={message.includes('thành công') ? 'alert alert-success mt-2' : 'alert alert-danger mt-2'}>
              {message}
            </div>
          )}
        </div>

        <div className="card col-6">
          <div className="card-title">
            <h3>Danh sách lớp</h3>
          </div>

          {classes.length === 0 && <p>Chưa có lớp nào, hãy tạo lớp mới.</p>}

          {classes.map((c) => (
            <div key={c.id} style={{ marginBottom: '0.5rem' }}>
              <Link to={`/teacher/classes/${c.id}`}>
                {c.className} <span className="text-muted">(Mã: {c.code})</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
