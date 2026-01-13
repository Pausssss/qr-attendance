import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosClient';
import StatusChip from '../../components/StatusChip';

export default function TeacherClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [newSession, setNewSession] = useState({ title: '', sessionDate: '' });

  const loadData = async () => {
    const [membersRes, sessionsRes, classesRes] = await Promise.all([
      api.get(`/api/teacher/classes/${id}/members`),
      api.get(`/api/teacher/classes/${id}/sessions`),
      api.get('/api/teacher/classes'),
    ]);

    setMembers(membersRes.data);
    setSessions(sessionsRes.data);
    setClassInfo(classesRes.data.find((c) => c.id === Number(id)) || null);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const createSession = async (e) => {
    e.preventDefault();
    if (!newSession.title || !newSession.sessionDate) return;
    await api.post(`/api/teacher/classes/${id}/sessions`, newSession);
    setNewSession({ title: '', sessionDate: '' });
    await loadData();
  };

  async function removeMember(memberId) {
    if (!window.confirm('Xóa sinh viên khỏi lớp?')) return;
    await api.delete(`/api/teacher/classes/${id}/members/${memberId}`);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function deleteClass() {
    if (!window.confirm('Xóa lớp (kèm buổi học + điểm danh) ?')) return;
    await api.delete(`/api/teacher/classes/${id}`);
    alert('Đã xóa lớp.');
    navigate('/teacher');
  }

  return (
    <div>
      <h2>Chi tiết lớp</h2>

      {classInfo && (
        <div className="card">
          <p>
            <strong>{classInfo.className}</strong> – Mã lớp: <code>{classInfo.code}</code>
          </p>
          <div className="flex">
            <Link to={`/teacher/classes/${id}/report`}>Xem báo cáo</Link>
            <button className="btn btnDanger btnSm" onClick={deleteClass}>
              Xóa lớp
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Sinh viên</h3>
        {members.length === 0 && <p>Chưa có sinh viên tham gia.</p>}
        {members.length > 0 && (
          <ul>
            {members.map((m) => (
              <li key={m.id} className="flex justify-between">
                <div>
                  <b>{m.fullName}</b> — {m.email}
                </div>
                <button className="btn btnDanger btnSm" onClick={() => removeMember(m.id)}>
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Buổi học</h3>
        <form onSubmit={createSession} className="row mb-3">
          <input
            className="input"
            placeholder="Tiêu đề (Tuần 3 - Tiết 1)"
            value={newSession.title}
            onChange={(e) => setNewSession((s) => ({ ...s, title: e.target.value }))}
          />
          <input
            className="input"
            type="datetime-local"
            value={newSession.sessionDate}
            onChange={(e) => setNewSession((s) => ({ ...s, sessionDate: e.target.value }))}
          />
          <button className="btn btnPrimary">Tạo buổi học</button>
        </form>

        {sessions.length === 0 && <p>Chưa có buổi học.</p>}
        {sessions.length > 0 && (
          <ul>
            {sessions.map((s) => {
              const variant =
                s.status === 'OPEN'
                  ? 'success'
                  : s.status === 'CLOSED'
                  ? 'danger'
                  : 'default';
              const label =
                s.status === 'OPEN'
                  ? 'Đang mở'
                  : s.status === 'CLOSED'
                  ? 'Đã đóng'
                  : s.status || '—';

              return (
                <li key={s.id} className="flex justify-between">
                  <Link to={`/teacher/sessions/${s.id}`} className="fw-900">
                    {s.title}
                    <span className="muted"> — {new Date(s.sessionDate).toLocaleString()}</span>
                  </Link>
                  <StatusChip variant={variant} label={label} />
                </li>
              );
            })}
          </ul>
        )}</div>
    </div>
  );
}
