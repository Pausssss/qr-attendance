// File: qr-attendance-frontend/src/pages/student/StudentClassDetail.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function StudentClassDetail() {
  const { id } = useParams(); // classId
  const [sessions, setSessions] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Lấy info lớp của chính sinh viên
        const classesRes = await api.get('/api/student/classes');
        const cls = classesRes.data.find((c) => c.id === Number(id));
        setClassInfo(cls || null);

        // Lấy danh sách buổi học 
        setLoadingSessions(true);
        try {
          const sessionsRes = await api.get(
            `/api/teacher/classes/${id}/sessions`
          );
          setSessions(sessionsRes.data || []);
        } catch (err) {
          console.error('Không tải được danh sách buổi học:', err);
          setSessions([]);
        } finally {
          setLoadingSessions(false);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu lớp:', err);
      }
    };

    load();
  }, [id]);

  return (
    <div>
      <h2>Lớp học</h2>

      {/* CARD LỚP HỌC – luôn có nút xem lịch sử */}
      <div className="card">
        <p>
          <strong>{classInfo ? classInfo.className : `Lớp #${id}`}</strong>{' '}
          {classInfo?.code && (
            <>
              – Mã: <code>{classInfo.code}</code>
            </>
          )}
        </p>
        <Link to={`/student/classes/${id}/attendance`}>
          Xem lịch sử điểm danh
        </Link>
      </div>

      {/* DANH SÁCH BUỔI HỌC */}
      <div className="card">
        <h3>Danh sách buổi học</h3>
        {loadingSessions && <p>Đang tải...</p>}
        {!loadingSessions && sessions.length === 0 && (
          <p>Chưa có buổi học nào hoặc không tải được danh sách buổi.</p>
        )}
        {!loadingSessions && sessions.length > 0 && (
          <ul>
            {sessions.map((s) => (
              <li key={s.id}>
                {s.title} – {new Date(s.sessionDate).toLocaleString()} –{' '}
                {s.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
