import React, { useState, useRef, useEffect } from 'react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import api from '../../api/axiosClient';

const GEO_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

function dataUrlToFile(dataUrl, filename = `selfie_${Date.now()}.jpg`) {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta && meta.match(/data:(.*);base64/))?.[1] || 'image/jpeg';
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

async function uploadSelfie(selfieDataUrl) {
  const file = dataUrlToFile(selfieDataUrl);
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/api/upload/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.photoUrl;
}

function resolveMediaUrl(url) {
  if (!url) return url;
  // backend trả về "/uploads/..." -> cần prefix baseURL để load được trên domain frontend
  if (typeof url === 'string' && url.startsWith('/uploads/')) {
    const base = (api.defaults.baseURL || '').replace(/\/+$/, '');
    const origin = base.replace(/\/api\/?$/, '');
    return `${origin}${url}`;
  }
  return url;
}

export default function StudentScanQR() {
  // step: scan QR -> selfie -> done
  const [step, setStep] = useState('scan'); 
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [payload, setPayload] = useState(null); // dữ liệu từ QR {sessionId, qrToken}
  const [attendance, setAttendance] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState({ distanceMeters: null, maxDistanceMeters: null });
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
          const accuracy = pos.coords.accuracy;
          if (accuracy && accuracy > 80) {
            setStatus('error');
            setMessage(
              `Vị trí hiện tại chưa chính xác (±${Math.round(
                accuracy
              )}m). Hãy bật "Độ chính xác cao" (High accuracy) và thử lại.`
            );
            return;
          }

          // ✅ Upload ảnh trước, chỉ lưu URL (ngắn) vào DB thay vì base64
          const photoUrl = await uploadSelfie(selfieDataUrl);
          if (!photoUrl) {
            setStatus('error');
            setMessage('Upload ảnh thất bại. Hãy thử chụp lại và gửi lại.');
            return;
          }

          const body = {
            payload,
            gpsLat: pos.coords.latitude,
            gpsLng: pos.coords.longitude,
            photoUrl, // "/uploads/xxx.jpg" (hoặc URL)
          };

          const res = await api.post('/api/attendance/check-in', body);
          setStatus('success');
          setMessage('Điểm danh thành công!');
          setAttendance(res.data.attendance || null);
          setDistanceInfo({
            distanceMeters: res.data?.distanceMeters ?? null,
            maxDistanceMeters: res.data?.maxDistanceMeters ?? null,
          });
          setStep('done');
          stopCamera();
        } catch (err) {
          console.error(err);
          setStatus('error');
          // Nếu backend có trả thêm distanceMeters/maxDistanceMeters trong lỗi, mình lưu lại để hiển thị cho dễ debug
          const d = err.response?.data?.distanceMeters ?? null;
          const m = err.response?.data?.maxDistanceMeters ?? null;
          setDistanceInfo({ distanceMeters: d, maxDistanceMeters: m });

          setMessage(
            err.response?.data?.message ||
              'Không điểm danh được. Hãy thử lại hoặc liên hệ giảng viên.'
          );
        }
      },
      () => {
        setStatus('error');
        setMessage('Không lấy được vị trí GPS. Hãy bật GPS và thử lại.');
      },
      GEO_OPTIONS
    );
  };

  const resetAll = () => {
    setStep('scan');
    setStatus('idle');
    setMessage('');
    setPayload(null);
    setAttendance(null);
    setSelfieDataUrl(null);
    setDistanceInfo({ distanceMeters: null, maxDistanceMeters: null });
  };

  return (
    <div className="scan-wrap">
      <div className="scan-card">
        <div className="scan-head">
          <div>
            <h2 className="scan-title">Điểm danh QR</h2>
            <p className="scan-sub">
              {step === 'scan'
                ? 'Hướng camera vào mã QR mà giảng viên đang chiếu.'
                : step === 'selfie'
                ? 'Chụp hình khuôn mặt để xác thực điểm danh.'
                : 'Hoàn tất điểm danh.'}
            </p>
          </div>

          {step !== 'scan' && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetAll}>
              Làm lại
            </button>
          )}
        </div>

        <div className="scan-body">
          {step === 'scan' && (
            <>
              <div className="scan-frame" style={{ aspectRatio: '500 / 350' }}>
                <span className="scan-line" aria-hidden="true" />
                <BarcodeScanner width={500} height={350} onUpdate={handleScanFromCamera} />
              </div>

              <div className="spacer" />

              {status === 'error' && <div className="alert alert-danger">{message}</div>}
              {status === 'idle' && <p className="text-muted">Đang chờ bạn quét mã...</p>}
            </>
          )}

          {step === 'selfie' && (
            <>
              <div className="flex" style={{ flexDirection: 'column', alignItems: 'center' }}>
                <div className="scan-frame" style={{ maxWidth: 360 }}>
                  <video ref={videoRef} autoPlay playsInline />
                </div>

                {selfieDataUrl && (
                  <img
                    src={selfieDataUrl}
                    alt="Selfie preview"
                    style={{
                      width: '100%',
                      maxWidth: 200,
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,.18)',
                      marginTop: 12,
                    }}
                  />
                )}
              </div>

              <div className="spacer" />

              <div className="flex justify-between">
                <div className="flex">
                  <button type="button" className="btn btn-secondary" onClick={handleCaptureSelfie}>
                    Chụp ảnh
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmitAttendance}
                    disabled={status === 'loading' || !selfieDataUrl}
                  >
                    {status === 'loading' ? 'Đang gửi...' : 'Gửi điểm danh'}
                  </button>
                </div>

                <button type="button" className="btn btn-ghost" onClick={resetAll}>
                  Quét lại
                </button>
              </div>

              {message && (
                <div className={status === 'error' ? 'alert alert-danger mt-2' : 'alert mt-2'}>
                  {message}
                </div>
              )}
            </>
          )}

          {step === 'done' && (
            <>
              <div className="alert alert-success">
                <strong>✅ Điểm danh thành công</strong>
                <div className="spacer" />
                <div>{message}</div>
              </div>

              {attendance && (
                <p className="text-muted mt-2">
                  Trạng thái: <strong>{attendance.status === 'ON_TIME' ? 'Đúng giờ' : 'Đi trễ'}</strong> – Lúc:{' '}
                  {attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleString() : '—'}
                </p>
              )}

              {(distanceInfo.distanceMeters !== null || distanceInfo.maxDistanceMeters !== null) && (
                <p className="text-muted">
                  Khoảng cách tới vị trí lớp: <strong>{distanceInfo.distanceMeters !== null ? `${distanceInfo.distanceMeters}m` : '—'}</strong>
                  {distanceInfo.maxDistanceMeters !== null ? ` (tối đa ${distanceInfo.maxDistanceMeters}m)` : ''}
                </p>
              )}

              {attendance?.photoUrl && (
                <div className="mt-2">
                  <p className="text-muted">Ảnh đã gửi:</p>
                  <img
                    src={resolveMediaUrl(attendance.photoUrl)}
                    alt="Đã gửi"
                    style={{
                      width: '100%',
                      maxWidth: 240,
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,.18)',
                    }}
                  />
                </div>
              )}

              <div className="spacer" />
              <button className="btn btn-primary" onClick={resetAll}>
                Quét tiếp buổi khác
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
