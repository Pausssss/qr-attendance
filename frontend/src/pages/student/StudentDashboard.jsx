import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const loadClasses = async () => {
    const res = await api.get('/api/student/classes');
    setClasses(res.data);
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const joinClass = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      // Normalize để tránh lỗi do copy/paste có khoảng trắng hoặc nhập chữ thường.
      const normalized = (code || '').trim().toUpperCase().replace(/\s+/g, '');
      if (!normalized) {
        setMessage('Vui lòng nhập mã lớp');
        return;
      }

      const res = await api.post('/api/student/classes/join', { classCode: normalized });
      setCode('');
      setMessage(res.data?.message || 'Tham gia lớp thành công!');
      await loadClasses();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không tham gia được lớp');
    }
  };

  return (
    <div>
      <div className="hero">
        <div className="hero-card">
          <h1 className="hero-title">Lớp học của tôi</h1>
          <p className="hero-sub">
            Tham gia lớp bằng mã, xem các buổi học và lịch sử điểm danh.
          </p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card col-6">
          <div className="card-title">
            <h3>Tham gia lớp bằng mã</h3>
          </div>

          <form onSubmit={joinClass} className="row">
            <input
              className="input"
              placeholder="Nhập mã lớp"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Tham gia
            </button>
          </form>

          {message && (
            <div
              className={
                /thành công|đã tham gia/i.test(message)
                  ? 'alert alert-success mt-2'
                  : 'alert alert-danger mt-2'
              }
            >
              {message}
            </div>
          )}
        </div>

        <div className="card col-6">
          <div className="card-title">
            <h3>Danh sách lớp</h3>
          </div>

          {classes.length === 0 && <p>Chưa có lớp nào.</p>}

          {classes.map((c) => (
            <div key={c.id} style={{ marginBottom: '0.5rem' }}>
              <Link to={`/student/classes/${c.id}`}>{c.className}</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
