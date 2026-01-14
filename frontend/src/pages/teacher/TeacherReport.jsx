import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosClient';

export default function TeacherReport() {
  const { id } = useParams(); // classId
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const res = await api.get(`/api/teacher/classes/${id}/report`);
        setReport(res.data);
      } catch (e) {
        console.error(e);
        setError(e.response?.data?.message || 'Không tải được báo cáo.');
      }
    };
    load();
  }, [id]);

  if (!report && !error) return <p>Đang tải...</p>;
  if (error) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h3>Báo cáo lớp</h3>
        </div>
        <div className="alert alert-danger">{error}</div>
        <div className="hint">
          Gợi ý: Nếu bạn vừa cập nhật chức năng chống trùng (normalized_title), hãy chạy migration DB để thêm cột
          <code> normalized_title </code> cho bảng sessions.
        </div>
      </div>
    );
  }

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
