// File: qr-attendance-frontend/src/pages/teacher/ReportPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function TeacherReport() {
  const { id } = useParams(); // classId
  const [report, setReport] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await api.get(`/api/teacher/classes/${id}/report`);
      setReport(res.data);
    };
    load();
  }, [id]);

  if (!report) return <p>Đang tải...</p>;

  return (
    <div>
      <h2>Báo cáo lớp</h2>
      <div className="card">
        <p>
          <strong>{report.class.className}</strong> – Mã:{' '}
          <code>{report.class.code}</code>
        </p>
        <p>Số buổi: {report.sessions.length}</p>
        <p>Số sinh viên: {report.students.length}</p>
      </div>

      <div className="card">
        <h3>Theo sinh viên</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Sinh viên</th>
              <th>Tổng buổi</th>
              <th>Có mặt</th>
              <th>Đúng giờ</th>
              <th>Trễ</th>
              <th>Vắng</th>
            </tr>
          </thead>
          <tbody>
            {report.perStudent.map((s) => (
              <tr key={s.studentId}>
                <td>
                  {s.fullName} ({s.email})
                </td>
                <td>{s.totalSessions}</td>
                <td>{s.present}</td>
                <td>{s.onTime}</td>
                <td>{s.late}</td>
                <td>{s.absent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
