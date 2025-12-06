// File: qr-attendance-frontend/src/pages/teacher/ClassDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function TeacherClassDetail() {
  const { id } = useParams();
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [newSession, setNewSession] = useState({ title: '', sessionDate: '' });

  const loadData = async () => {
    const [membersRes, sessionsRes, classesRes] = await Promise.all([
      api.get(`/api/teacher/classes/${id}/members`),
      api.get(`/api/teacher/classes/${id}/sessions`),
      api.get('/api/teacher/classes')
    ]);

    setMembers(membersRes.data);
    setSessions(sessionsRes.data);
    setClassInfo(classesRes.data.find((c) => c.id === Number(id)));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const createSession = async (e) => {
    e.preventDefault();
    if (!newSession.title || !newSession.sessionDate) return;
    await api.post(`/api/teacher/classes/${id}/sessions`, newSession);
    setNewSession({ title: '', sessionDate: '' });
    await loadData();
  };

  return (
    <div>
      <h2>Chi tiết lớp</h2>
      {classInfo && (
        <div className="card">
          <p>
            <strong>{classInfo.className}</strong> – Mã lớp:{' '}
            <code>{classInfo.code}</code>
          </p>
          <Link to={`/teacher/classes/${id}/report`}>Xem báo cáo</Link>
        </div>
      )}

      <div className="card">
        <h3>Sinh viên</h3>
        {members.length === 0 && <p>Chưa có sinh viên tham gia.</p>}
        <ul>
          {members.map((m) => (
            <li key={m.id}>
              {m.fullName} – {m.email}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Buổi học</h3>
        <form onSubmit={createSession} style={{ marginBottom: '1rem' }}>
          <input
            placeholder="Tiêu đề (Tuần 3 - Tiết 1)"
            value={newSession.title}
            onChange={(e) =>
              setNewSession((s) => ({ ...s, title: e.target.value }))
            }
          />
          <input
            type="datetime-local"
            value={newSession.sessionDate}
            onChange={(e) =>
              setNewSession((s) => ({ ...s, sessionDate: e.target.value }))
            }
          />
          <button>Tạo buổi học</button>
        </form>

        {sessions.map((s) => (
          <div key={s.id} style={{ marginBottom: '0.5rem' }}>
            <Link to={`/teacher/sessions/${s.id}`}>
              {s.title} – {new Date(s.sessionDate).toLocaleString()} –{' '}
              {s.status}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
