// File: qr-attendance-frontend/src/pages/student/StudentClassDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function StudentClassDetail() {
  const { id } = useParams(); // classId
  const [sessions, setSessions] = useState([]);
  const [classInfo, setClassInfo] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [classesRes, sessionsRes] = await Promise.all([
        api.get('/api/student/classes'),
        // reuse teacher endpoint just để lấy list session
        api.get(`/api/teacher/classes/${id}/sessions`)
      ]);
      setClassInfo(classesRes.data.find((c) => c.id === Number(id)));
      setSessions(sessionsRes.data);
    };
    load();
  }, [id]);

  return (
    <div>
      <h2>Lớp học</h2>
      {classInfo && (
        <div className="card">
          <p>
            <strong>{classInfo.className}</strong> – Mã:{' '}
            <code>{classInfo.code}</code>
          </p>
          <Link to={`/student/classes/${id}/history`}>Xem lịch sử điểm danh</Link>
        </div>
      )}
      <div className="card">
        <h3>Danh sách buổi học</h3>
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              {s.title} – {new Date(s.sessionDate).toLocaleString()} –{' '}
              {s.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
