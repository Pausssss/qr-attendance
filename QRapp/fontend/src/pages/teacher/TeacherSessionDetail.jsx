// File: src/pages/teacher/TeacherSessionDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosClient';
import { QRCodeCanvas } from 'qrcode.react';

export default function TeacherSessionDetail() {
  // URL: /teacher/sessions/:sessionId
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [qrPayload, setQrPayload] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null); // popup ảnh lớn

  const loadSession = async () => {
    const classesRes = await api.get('/api/teacher/classes');
    const sessionsByClassPromises = classesRes.data.map((c) =>
      api.get(`/api/teacher/classes/${c.id}/sessions`)
    );
    const sessionLists = await Promise.all(sessionsByClassPromises);

    let found = null;
    const idNum = Number(sessionId);
    for (const list of sessionLists) {
      const s = list.data.find((x) => x.id === idNum);
      if (s) {
        found = s;
        break;
      }
    }
    setSession(found);
  };

  const loadAttendance = async () => {
    try {
      const res = await api.get(`/api/teacher/sessions/${sessionId}/attendance`);
      setAttendance(res.data);
    } catch {
      setAttendance([]);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    loadSession();
    loadAttendance();
  }, [sessionId]);

  const openSession = async () => {
    if (!navigator.geolocation) {
      alert('Thiết bị không hỗ trợ GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const body = {
            teacherLat: pos.coords.latitude,
            teacherLng: pos.coords.longitude,
          };
          const res = await api.put(
            `/api/teacher/sessions/${sessionId}/open`,
            body
          );
          setSession(res.data);
          setQrPayload(res.data.qrPayload);
        } catch (err) {
          console.error(err);
          alert(
            err.response?.data?.message ||
              'Không mở được phiên điểm danh, hãy thử lại.'
          );
        }
      },
      () => {
        alert('Không lấy được vị trí GPS. Hãy bật GPS và cho phép quyền truy cập.');
      }
    );
  };

  const closeSession = async () => {
    const res = await api.put(`/api/teacher/sessions/${sessionId}/close`);
    setSession(res.data);
    setQrPayload(null);
  };

  // build qrPayload khi session OPEN và có qrToken
  useEffect(() => {
    if (session && session.status === 'OPEN' && session.qrToken) {
      setQrPayload({ sessionId: session.id, qrToken: session.qrToken });
    }
  }, [session]);

  if (!session) return <p>Đang tải...</p>;

  return (
    <div>
      <h2>Chi tiết buổi học</h2>

      <div className="card">
        <p>
          <strong>{session.title}</strong>
        </p>
        <p>Thời gian: {new Date(session.sessionDate).toLocaleString()}</p>
        <p>Trạng thái: {session.status}</p>

        <button onClick={openSession} disabled={session.status === 'OPEN'}>
          Mở điểm danh
        </button>{' '}
        <button onClick={closeSession} disabled={session.status === 'CLOSED'}>
          Đóng điểm danh
        </button>

        {qrPayload && session.status === 'OPEN' && (
          <div style={{ marginTop: '1rem' }}>
            <h3>QR code cho sinh viên</h3>
            <p className="qr-hint">
              (Nhấn vào mã QR để phóng to cho sinh viên quét)
            </p>
            <div
              style={{
                display: 'inline-block',
                padding: 8,
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer',
              }}
              onClick={() => setShowQrModal(true)}
            >
              <QRCodeCanvas value={JSON.stringify(qrPayload)} size={180} />
            </div>
          </div>
        )}
      </div>

      {/* POPUP QR TO */}
      {showQrModal && qrPayload && (
        <div
          onClick={() => setShowQrModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 12,
              textAlign: 'center',
              maxWidth: '90vw',
            }}
          >
            <h3>Quét mã QR</h3>
            <QRCodeCanvas
              value={JSON.stringify(qrPayload)}
              size={340}
              includeMargin={true}
            />
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setShowQrModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* DANH SÁCH ĐIỂM DANH */}
      <div className="card">
        <h3>DANH SÁCH ĐIỂM DANH</h3>
        {attendance.length === 0 && <p>Chưa có sinh viên điểm danh.</p>}
        {attendance.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Sinh viên</th>
                <th>Giờ vào</th>
                <th>Trạng thái</th>
                <th>Ảnh</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.fullName} ({a.email})
                  </td>
                  <td>
                    {a.checkInTime
                      ? new Date(a.checkInTime).toLocaleString()
                      : '-'}
                  </td>
                  <td>{a.status}</td>
                  <td>
                    {a.photoUrl ? (
                      <img
                        src={a.photoUrl}
                        alt="Selfie"
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: 'cover',
                          borderRadius: 12,
                          cursor: 'pointer',
                        }}
                        onClick={() => setPhotoPreview(a.photoUrl)}
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* POPUP ẢNH SELFIE */}
      {photoPreview && (
        <div
          onClick={() => setPhotoPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 12,
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <img
              src={photoPreview}
              alt="Selfie preview"
              style={{
                maxWidth: '80vw',
                maxHeight: '80vh',
                borderRadius: 16,
              }}
            />
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button onClick={() => setPhotoPreview(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
