import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return classes;
    return classes.filter((c) => {
      return (
        String(c.className || '').toLowerCase().includes(kw) ||
        String(c.code || '').toLowerCase().includes(kw)
      );
    });
  }, [classes, q]);

  return (
    <div className="dash">
      <div className="dash-hero">
        <div className="dash-hero-left">
          <h1 className="dash-title">Lớp học của tôi</h1>
          <p className="dash-sub">Tham gia lớp bằng mã, xem buổi học và lịch sử điểm danh.</p>

          <div className="dash-kpis">
            <div className="kpi">
              <div className="kpi-value">{classes.length}</div>
              <div className="kpi-label">Lớp đã tham gia</div>
            </div>
          </div>
        </div>

        <div className="dash-hero-right">
          <div className="dash-search">
            <input
              className="input"
              placeholder="Tìm theo tên lớp hoặc mã lớp…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Tham gia lớp bằng mã</h3>
            <span className="pill">Nhanh</span>
          </div>

          <form onSubmit={joinClass} className="stack">
            <div className="field">
              <label className="label">Mã lớp</label>
              <input
                className="input"
                placeholder="Nhập mã lớp"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang tham gia...' : 'Tham gia'}
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

          <div className="hint">Mẹo: Mã lớp do giảng viên cung cấp (VD: L34ERN).</div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Danh sách lớp</h3>
            <span className="text-muted">
              {filtered.length}/{classes.length}
            </span>
          </div>

          {classes.length === 0 && (
            <div className="empty">
              <div className="empty-title">Chưa tham gia lớp nào</div>
              <div className="empty-sub">Nhập mã lớp ở cột bên trái để tham gia.</div>
            </div>
          )}

          {classes.length > 0 && filtered.length === 0 && (
            <div className="empty">
              <div className="empty-title">Không tìm thấy lớp phù hợp</div>
              <div className="empty-sub">Thử tìm theo mã lớp hoặc rút gọn từ khóa.</div>
            </div>
          )}

          <div className="class-list">
            {filtered.map((c) => (
              <div key={c.id} className="class-item">
                <div className="class-meta">
                  <div className="class-name">{c.className}</div>
                  <div className="class-code">Mã lớp: {c.code}</div>
                </div>

                <div className="class-actions">
                  <Link className="btn btn-ghost" to={`/student/classes/${c.id}`}>
                    Xem lớp
                  </Link>
                  <Link className="btn btn-light" to={`/student/classes/${c.id}/history`}>
                    Lịch sử
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
