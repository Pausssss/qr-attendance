import React, { useState, useRef, useEffect } from 'react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import api from '../../api/axiosClient';

export default function StudentScanQR() {
  // step: scan QR -> selfie -> done
  const [step, setStep] = useState('scan'); 
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [payload, setPayload] = useState(null); // dữ liệu từ QR {sessionId, qrToken}
  const [attendance, setAttendance] = useState(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ====== CAMERA SELFIE ======
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Không mở được camera. Hãy kiểm tra quyền truy cập camera.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (step === 'selfie') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step]);

  const handleCaptureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelfieDataUrl(dataUrl);
    setMessage('Đã chụp ảnh, bấm "Gửi điểm danh" để hoàn tất.');
  };

  // ====== STEP 1: QUÉT QR ======
  const handleScanFromCamera = (err, result) => {
    if (step !== 'scan') return; // tránh scan nhiều lần
    if (err) {
      console.error(err);
      // không set lỗi liên tục, chỉ log
      return;
    }
    if (!result) return;

    // react-qr-barcode-scanner: text nằm trong result.text hoặc result.getText()
    const text =
      typeof result.getText === 'function' ? result.getText() : result.text;

    if (!text) return;

    try {
      const qrPayload = JSON.parse(text);

      if (!qrPayload.sessionId || !qrPayload.qrToken) {
        setStatus('error');
        setMessage('Mã QR thiếu thông tin cần thiết.');
        return;
      }

      setPayload(qrPayload);
      setStatus('idle');
      setMessage('');
      setStep('selfie'); // chuyển sang bước chụp mặt
    } catch (e) {
      console.error(e);
      setStatus('error');
      setMessage('Mã QR không hợp lệ.');
    }
  };

  // ====== STEP 2: GỬI ĐIỂM DANH (QR + GPS + SELFIE) ======
  const handleSubmitAttendance = async () => {
    if (!payload) {
      setStatus('error');
      setMessage('Chưa có dữ liệu QR.');
      return;
    }
    if (!selfieDataUrl) {
      setStatus('error');
      setMessage('Bạn cần chụp hình khuôn mặt trước khi gửi.');
      return;
    }

    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Thiết bị không hỗ trợ GPS. Vui lòng thử trên điện thoại.');
      return;
    }

    setStatus('loading');
    setMessage('Đang gửi dữ liệu điểm danh...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const body = {
            payload,
            gpsLat: pos.coords.latitude,
            gpsLng: pos.coords.longitude,
            photoUrl: selfieDataUrl, // base64 dataURL
          };

          const res = await api.post('/api/attendance/check-in', body);
          setStatus('success');
          setMessage('Điểm danh thành công!');
          setAttendance(res.data.attendance || null);
          setStep('done');
          stopCamera();
        } catch (err) {
          console.error(err);
          setStatus('error');
          setMessage(
            err.response?.data?.message ||
              'Không điểm danh được. Hãy thử lại hoặc liên hệ giảng viên.'
          );
        }
      },
      () => {
        setStatus('error');
        setMessage('Không lấy được vị trí GPS. Hãy bật GPS và thử lại.');
      }
    );
  };

  const resetAll = () => {
    setStep('scan');
    setStatus('idle');
    setMessage('');
    setPayload(null);
    setAttendance(null);
    setSelfieDataUrl(null);
  };

  return (
    <div>
      <h2>Quét mã QR để điểm danh</h2>

      <div className="card">
        {step === 'scan' && (
          <>
            <p className="text-muted">
               Hướng camera vào mã QR mà giảng viên đang chiếu.
            </p>

            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <BarcodeScanner
                width={500}
                height={350}
                onUpdate={handleScanFromCamera}
              />
            </div>

            {status === 'error' && (
              <p style={{ color: '#b91c1c' }}>{message}</p>
            )}
            {status === 'idle' && (
              <p className="text-muted mt-2">Đang chờ bạn quét mã...</p>
            )}
          </>
        )}

        {step === 'selfie' && (
          <>
            <p className="text-muted">
              Chụp hình khuôn mặt bạn để xác thực điểm danh.
            </p>
            <div
              style={{
                marginTop: '1rem',
                marginBottom: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  maxWidth: 360,
                  borderRadius: 16,
                  backgroundColor: '#000',
                }}
                autoPlay
                playsInline
              />
              {selfieDataUrl && (
                <img
                  src={selfieDataUrl}
                  alt="Selfie preview"
                  style={{
                    width: '100%',
                    maxWidth: 200,
                    borderRadius: 16,
                    border: '1px solid #e5e7eb',
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={handleCaptureSelfie}>
                Chụp ảnh
              </button>
              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={status === 'loading' || !selfieDataUrl}
              >
                {status === 'loading' ? 'Đang gửi...' : 'Gửi điểm danh'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={resetAll}
                style={{ marginLeft: 'auto' }}
              >
                Quét lại từ đầu
              </button>
            </div>

            {message && (
              <p
                className="mt-2"
                style={{ color: status === 'error' ? '#b91c1c' : '#6b7280' }}
              >
                {message}
              </p>
            )}
          </>
        )}

        {step === 'done' && (
          <>
            <h3 style={{ color: '#16a34a', marginBottom: '0.25rem' }}>
              ✅ Điểm danh thành công
            </h3>
            <p>{message}</p>
            {attendance && (
              <p className="text-muted">
                Trạng thái:{' '}
                <strong>
                  {attendance.status === 'ON_TIME' ? 'Đúng giờ' : 'Đi trễ'}
                </strong>{' '}
                – Lúc:{' '}
                {attendance.checkInTime
                  ? new Date(attendance.checkInTime).toLocaleString()
                  : '—'}
              </p>
            )}
            {attendance?.photoUrl && (
              <div className="mt-2">
                <p className="text-muted">Ảnh đã gửi:</p>
                <img
                  src={attendance.photoUrl}
                  alt="Đã gửi"
                  style={{
                    width: '100%',
                    maxWidth: 200,
                    borderRadius: 16,
                    border: '1px solid #e5e7eb',
                  }}
                />
              </div>
            )}
            <button className="mt-3" onClick={resetAll}>
              Quét tiếp buổi khác
            </button>
          </>
        )}
      </div>
    </div>
  );
}
