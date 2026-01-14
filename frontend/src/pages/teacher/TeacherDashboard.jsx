import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [q, setQ] = useState('');

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


  const handleDeleteClass = async (classId) => {
    const ok = window.confirm('Xóa lớp này? (Sẽ xóa cả sinh viên, buổi học và dữ liệu điểm danh)');
    if (!ok) return;

    try {
      setMessage('');
      await api.delete(`/api/teacher/classes/${classId}`);
      await loadClasses();
      setMessage('Đã xóa lớp.');
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Không thể xóa lớp, vui lòng thử lại.');
    }
  };

  const filtered = classes.filter((c) => {
    const kw = q.trim().toLowerCase();
    if (!kw) return true;
    return (
      String(c.className || '').toLowerCase().includes(kw) ||
      String(c.code || '').toLowerCase().includes(kw)
    );
  });

  return (
    <div className="dash">
      <div className="dash-hero">
        <div className="dash-hero-left">
          <h1 className="dash-title">Trang giảng viên</h1>
          <p className="dash-sub">
            Tạo lớp, quản lý sinh viên, mở/đóng điểm danh và xem báo cáo.
          </p>

          <div className="dash-kpis">
            <div className="kpi">
              <div className="kpi-value">{classes.length}</div>
              <div className="kpi-label">Lớp học</div>
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
            <h3>Tạo lớp mới</h3>
            <span className="pill">Nhanh</span>
          </div>

          <form onSubmit={handleCreateClass} className="stack">
            <div className="field">
              <label className="label">Tên lớp</label>
              <input
                className="input"
                placeholder="VD: Lập trình Web 1"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo lớp'}
            </button>
          </form>

          {message && (
            <div
              className={
                message.includes('thành công')
                  ? 'alert alert-success mt-2'
                  : 'alert alert-danger mt-2'
              }
            >
              {message}
            </div>
          )}

          <div className="hint">
            Mẹo: Sau khi tạo lớp, bạn vào lớp để thêm sinh viên và mở phiên điểm danh.
          </div>
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
              <div className="empty-title">Chưa có lớp nào</div>
              <div className="empty-sub">Hãy tạo lớp mới ở cột bên trái để bắt đầu.</div>
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
                  <Link className="btn btn-ghost" to={`/teacher/classes/${c.id}`}>
                    Quản lí lớp
                  </Link>
                  <Link className="btn btn-light" to={`/teacher/classes/${c.id}/report`}>
                    Báo cáo
                  </Link>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => handleDeleteClass(c.id)}
                    title="Xóa lớp"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
