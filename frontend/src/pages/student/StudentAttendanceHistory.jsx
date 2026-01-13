import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosClient';
import StatusChip from '../../components/StatusChip';

export default function StudentAttendanceHistory() {
  const { id } = useParams(); // classId
  const [history, setHistory] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/student/classes/${id}/attendance-history`
      );
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClassInfo = async () => {
    try {
      const res = await api.get('/api/student/classes');
      const idNum = Number(id);
      const found = res.data.find((c) => c.id === idNum);
      setClassInfo(found || null);
    } catch (err) {
      console.error(err);
      setClassInfo(null);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadHistory();
    loadClassInfo();
  }, [id]);

  return (
    <div className="container">
      <h2>Lịch sử điểm danh</h2>

      <div className="card">
        {classInfo && (
          <p>
            <strong>Lớp:</strong> {classInfo.className}{' '}
            {classInfo.code && (
              <>
                – Mã: <code>{classInfo.code}</code>
              </>
            )}
          </p>
        )}
        <p className="text-muted">
          Xem lại các buổi học và trạng thái điểm danh của bạn trong lớp này.
        </p>
        <Link to={`/student/classes/${id}`} className="btn btnSm mt-2">
          ← Quay lại chi tiết lớp
        </Link>
      </div>

      <div className="card">
        {loading && <p>Đang tải...</p>}

        {!loading && history.length === 0 && (
          <p>Chưa có buổi học nào hoặc bạn chưa điểm danh buổi nào.</p>
        )}

        {!loading && history.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Buổi</th>
                <th>Ngày giờ</th>
                <th>Trạng thái</th>
                <th>Giờ điểm danh</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.sessionId}>
                  <td>{row.title}</td>
                  <td>
                    {row.sessionDate
                      ? new Date(row.sessionDate).toLocaleString()
                      : '—'}
                  </td>
                  <td>
                    {row.status ? (
                      row.status === 'ON_TIME' ? (
                        <StatusChip variant="success" label="Đúng giờ" />
                      ) : (
                        <StatusChip variant="warning" label="Đi trễ" />
                      )
                    ) : (
                      <StatusChip variant="danger" label="Chưa điểm danh" />
                    )}
                  </td>
                  <td>
                    {row.checkInTime
                      ? new Date(row.checkInTime).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
