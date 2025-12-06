// File: qr-attendance-frontend/src/pages/student/ScanQrPage.jsx
import React, { useState } from 'react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import api from '../../api/axiosClient';

export default function StudentScanQR() {
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleUpdate = async (err, res) => {
    if (err) {
      console.error(err);
      setStatus('Không thể đọc QR, thử lại hoặc kiểm tra quyền camera');
      return;
    }
    if (!res) return; // chưa thấy gì

    // Mỗi khi đọc được QR => dừng scan, xử lý check-in
    setScanning(false);

    try {
      const text = res.text || res.getText?.() || '';
      const payload = JSON.parse(text); // QR chứa JSON { sessionId, qrToken }
      setResult(payload);

      // Lấy GPS (nếu trình duyệt cho phép)
      const gps = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve({});
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              gpsLat: pos.coords.latitude,
              gpsLng: pos.coords.longitude
            }),
          () => resolve({})
        );
      });

      const response = await api.post('/api/attendance/check-in', {
        payload,
        ...gps,
        photoUrl: null // chừa chỗ upload selfie sau
      });

      setStatus(response.data.message || 'Điểm danh thành công');
    } catch (error) {
      console.error(error);
      setStatus(
        error.response?.data?.message ||
          'Điểm danh thất bại. Kiểm tra lại QR hoặc trạng thái buổi học.'
      );
    }
  };

  return (
    <div>
      <h2>Điểm danh bằng QR</h2>
      <div className="card">
        {!scanning && (
          <button onClick={() => {
            setStatus('');
            setResult(null);
            setScanning(true);
          }}>
            Mở camera quét QR
          </button>
        )}

        {scanning && (
          <div style={{ maxWidth: 400 }}>
            <BarcodeScanner
              width={400}
              height={400}
              facingMode="environment"   // ưu tiên camera sau
              onUpdate={handleUpdate}
            />
          </div>
        )}

        {result && (
          <p style={{ marginTop: '1rem' }}>
            Đã đọc QR cho sessionId: <strong>{result.sessionId}</strong>
          </p>
        )}
        {status && <p style={{ marginTop: '0.5rem' }}>Kết quả: {status}</p>}
      </div>
    </div>
  );
}
