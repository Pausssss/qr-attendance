// File: qr-attendance-frontend/src/pages/student/AttendanceHistoryPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function StudentAttendanceHistory() {
  const { id } = useParams(); // classId
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await api.get(`/api/student/attendance/history?classId=${id}`);
      setHistory(res.data);
    };
    load();
  }, [id]);

  return (
    <div>
      <h2>Lịch sử điểm danh</h2>
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Buổi</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.sessionId}>
                <td>{h.title}</td>
                <td>{new Date(h.sessionDate).toLocaleString()}</td>
                <td>{h.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
