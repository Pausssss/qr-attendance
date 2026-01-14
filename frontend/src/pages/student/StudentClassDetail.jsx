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
        // ⚠️ Dùng API của SINH VIÊN để tránh bị chặn quyền (Student không được gọi /api/teacher/*)
        setLoadingSessions(true);
        try {
          const sessionsRes = await api.get(
            `/api/student/classes/${id}/sessions`
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
      <div className="card">
        <p>
          <strong>{classInfo ? classInfo.className : `Lớp #${id}`}</strong>{' '}
          {classInfo?.code && (
            <>
              – Mã: <code>{classInfo.code}</code>
            </>
          )}
        </p>
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