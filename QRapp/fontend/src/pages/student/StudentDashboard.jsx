// File: qr-attendance-frontend/src/pages/student/StudentDashboard.jsx
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
      await api.post('/api/student/classes/join', { classCode: code });
      setCode('');
      setMessage('Tham gia lớp thành công!');
      await loadClasses();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không tham gia được lớp');
    }
  };

  return (
    <div>
      <h2>Lớp học của tôi</h2>
      <div className="card">
        <h3>Tham gia lớp bằng mã</h3>
        <form onSubmit={joinClass}>
          <input
            placeholder="Nhập mã lớp"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button>Tham gia</button>
        </form>
        {message && <p>{message}</p>}
      </div>

      <div className="card">
        <h3>Danh sách lớp</h3>
        {classes.map((c) => (
          <div key={c.id} style={{ marginBottom: '0.5rem' }}>
            <Link to={`/student/classes/${c.id}`}>{c.className}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
