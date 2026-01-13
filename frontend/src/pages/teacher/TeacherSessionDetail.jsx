import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosClient';
import { QRCodeCanvas } from 'qrcode.react';

const GEO_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

function resolveMediaUrl(url) {
  if (!url) return url;
  if (typeof url === 'string' && url.startsWith('/uploads/')) {
    const base = (api.defaults.baseURL || '').replace(/\/+$/, '');
    // Nếu baseURL bị set là .../api thì strip để ảnh trỏ đúng /uploads/**
    const origin = base.replace(/\/api\/?$/, '');
    return `${origin}${url}`;
  }
  return url;
}

export default function TeacherSessionDetail() {
  // URL: /teacher/sessions/:sessionId
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [qrPayload, setQrPayload] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const loadSession = async () => {
    // backend chưa có endpoint get session by id => tìm qua classes/sessions
    const classesRes = await api.get('/api/teacher/classes');
    const sessionsByClassPromises = classesRes.data.map((c) => api.get(`/api/teacher/classes/${c.id}/sessions`));
    const sessionLists = await Promise.all(sessionsByClassPromises);

    let found = null;
    const idNum = Number(sessionId);
    for (let idx = 0; idx < sessionLists.length; idx++) {
      const list = sessionLists[idx];
      const s = list.data.find((x) => x.id === idNum);
      if (s) {
        found = s;
        break;
      }
    }

    setSession(found);

    // load members of that class (for manual check-in)
    if (found?.classId) {
      try {
        const memRes = await api.get(`/api/teacher/classes/${found.classId}/members`);
        setMembers(memRes.data || []);
      } catch {
        setMembers([]);
      }
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const attendedStudentIds = useMemo(() => {
    const set = new Set();
    (attendance || []).forEach((a) => {
      if (a?.studentId != null) set.add(Number(a.studentId));
    });
    return set;
  }, [attendance]);

  const openSession = async () => {
    if (!navigator.geolocation) {
      alert('Thiết bị không hỗ trợ GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const accuracy = pos.coords.accuracy;
          if (accuracy && accuracy > 120) {
            alert(
              `Vị trí giảng viên chưa chính xác (±${Math.round(
                accuracy
              )}m). Hãy bật "Độ chính xác cao" hoặc mở điểm danh bằng điện thoại để GPS chuẩn hơn.`
            );
            return;
          }

          const body = {
            teacherLat: pos.coords.latitude,
            teacherLng: pos.coords.longitude,
          };
          const res = await api.put(`/api/teacher/sessions/${sessionId}/open`, body);
          setSession(res.data);
          setQrPayload(res.data.qrPayload);
        } catch (err) {
          console.error(err);
          alert(err.response?.data?.message || 'Không mở được phiên điểm danh, hãy thử lại.');
        }
      },
      () => {
        alert('Không lấy được vị trí GPS. Hãy bật GPS và cho phép quyền truy cập.');
      },
      GEO_OPTIONS
    );
  };

  const closeSession = async () => {
    const res = await api.put(`/api/teacher/sessions/${sessionId}/close`);
    setSession(res.data);
    setQrPayload(null);
  };

  const deleteSession = async () => {
    if (!window.confirm('Xóa buổi học này (kèm toàn bộ điểm danh) ?')) return;
    await api.delete(`/api/teacher/sessions/${sessionId}`);
    alert('Đã xóa buổi học.');
    // quay lại lớp
    if (session?.classId) navigate(`/teacher/classes/${session.classId}`);
    else navigate('/teacher');
  };

  const manualCheckIn = async (studentId) => {
    try {
      await api.post(`/api/teacher/sessions/${sessionId}/manual-attendance`, {
        studentId,
        note: '',
      });
      await loadAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Không điểm danh thủ công được.');
    }
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

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={openSession} disabled={session.status === 'OPEN'}>
            Mở điểm danh
          </button>
          <button onClick={closeSession} disabled={session.status === 'CLOSED'}>
            Đóng điểm danh
          </button>
          <button className="btn btnDanger btnSm" onClick={deleteSession}>
            Xóa buổi học
          </button>
        </div>

        {qrPayload && session.status === 'OPEN' && (
          <div style={{ marginTop: '1rem' }}>
            <h3>QR code cho sinh viên</h3>
            <p className="qr-hint">(Nhấn vào mã QR để phóng to cho sinh viên quét)</p>
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
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Quét mã QR</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowQrModal(false)}
              >
                Đóng
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: "center" }}>
              <QRCodeCanvas
                value={JSON.stringify(qrPayload)}
                size={340}
                includeMargin={true}
              />
            </div>
          </div>
        </div>
      )}

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
            <QRCodeCanvas value={JSON.stringify(qrPayload)} size={340} includeMargin={true} />
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setShowQrModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ATTENDANCE */}
      <div className="card">
        <h3>Điểm danh thủ công (fallback)</h3>
        {members.length === 0 && <p>Chưa có sinh viên trong lớp.</p>}
        {members.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Sinh viên</th>
                <th style={{ width: 180 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const done = attendedStudentIds.has(Number(m.studentId));
                return (
                  <tr key={m.id}>
                    <td>
                      {m.fullName} ({m.email})
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btnSm"
                        disabled={done}
                        onClick={() => manualCheckIn(m.studentId)}
                      >
                        {done ? 'Đã điểm danh' : 'Điểm danh thủ công'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ATTENDANCE LIST */}
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
                  <td>{a.checkInTime ? new Date(a.checkInTime).toLocaleString() : '-'}</td>
                  <td>{a.status}</td>
                  <td>
                    {a.photoUrl ? (
                      <img
                        src={resolveMediaUrl(a.photoUrl)}
                        alt="Selfie"
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: 'cover',
                          borderRadius: 12,
                          cursor: 'pointer',
                        }}
                        onClick={() => setPhotoPreview(resolveMediaUrl(a.photoUrl))}
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
        <div className="modal-backdrop" onClick={() => setPhotoPreview(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Ảnh selfie</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPhotoPreview(null)}
              >
                Đóng
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: "center" }}>
              <img
                src={resolveMediaUrl(photoPreview)}
                alt="Selfie preview"
                style={{ maxWidth: "80vw", maxHeight: "80vh", borderRadius: 16 }}
              />
            </div>
          </div>
        </div>
      )}

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
              src={resolveMediaUrl(photoPreview)}
              alt="Selfie preview"
              style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 16 }}
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
