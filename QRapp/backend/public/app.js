// URL backend (Express API)
const API_BASE_URL = 'http://localhost:4000';

const params = new URLSearchParams(window.location.search);
const sessionId = params.get('sid');
const token = params.get('t');

const userIdInput = document.getElementById('userIdInput');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const getLocationBtn = document.getElementById('getLocationBtn');
const locationStatus = document.getElementById('locationStatus');
const statusEl = document.getElementById('status');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const sessionInfo = document.getElementById('sessionInfo');

let stream = null;
let currentLat = null;
let currentLng = null;

// Hiển thị thông tin từ query
if (!sessionId || !token) {
  sessionInfo.textContent =
    'Link QR không hợp lệ (thiếu sid hoặc t). Hãy quét lại.';
} else {
  sessionInfo.textContent = `Session ID: ${sessionId}, token: ${token.substring(
    0,
    6
  )}...`;
}

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = 'status ' + type;
}

// Bật camera
startCameraBtn.addEventListener('click', async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus(
      'Trình duyệt không hỗ trợ camera (getUserMedia). Vui lòng dùng Chrome/Edge mới.',
      'error'
    );
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    });
    video.srcObject = stream;
    captureBtn.disabled = false;
    setStatus('Camera đã bật. Nhìn vào camera rồi nhấn "Chụp & gửi điểm danh".');
  } catch (err) {
    console.error(err);
    setStatus('Không thể bật camera. Hãy kiểm tra quyền truy cập.', 'error');
  }
});

// Lấy vị trí GPS
getLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    locationStatus.textContent =
      'Trình duyệt không hỗ trợ geolocation. Hãy bật GPS / dùng trình duyệt khác.';
    return;
  }

  locationStatus.textContent = 'Đang lấy vị trí...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentLat = pos.coords.latitude;
      currentLng = pos.coords.longitude;
      locationStatus.textContent = `Vị trí: ${currentLat.toFixed(
        5
      )}, ${currentLng.toFixed(5)}`;
    },
    (err) => {
      console.error(err);
      locationStatus.textContent =
        'Không thể lấy vị trí. Hãy cho phép truy cập vị trí.';
    },
    {
      enableHighAccuracy: true,
      timeout: 10000
    }
  );
});

// Chụp ảnh từ video và gửi checkin
captureBtn.addEventListener('click', async () => {
  const userId = userIdInput.value.trim();

  if (!sessionId || !token) {
    setStatus('Link QR không hợp lệ.', 'error');
    return;
  }

  if (!userId) {
    setStatus('Vui lòng nhập mã sinh viên / User ID.', 'error');
    return;
  }

  if (!stream) {
    setStatus('Hãy bật camera trước khi chụp.', 'error');
    return;
  }

  if (currentLat == null || currentLng == null) {
    setStatus('Hãy cho phép và lấy vị trí GPS trước khi điểm danh.', 'error');
    return;
  }

  // Capture frame từ video
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    setStatus(
      'Không thể đọc kích thước video. Hãy chờ 1-2 giây rồi thử lại.',
      'error'
    );
    return;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  // Lấy data URL (base64) của ảnh
  const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);

  setStatus('Đang gửi điểm danh...', '');

  try {
    const resp = await fetch(`${API_BASE_URL}/api/attendance/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        token,
        userId,
        photo: photoDataUrl,
        lat: currentLat,
        lng: currentLng,
        timestamp: new Date().toISOString()
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      setStatus(
        data.message || 'Điểm danh thất bại. Hãy thử lại hoặc liên hệ giảng viên.',
        'error'
      );
    } else {
      setStatus('Điểm danh thành công!', 'success');
    }
  } catch (err) {
    console.error(err);
    setStatus('Lỗi kết nối tới server. Hãy thử lại.', 'error');
  }
});

// Optional: cleanup stream khi rời trang
window.addEventListener('beforeunload', () => {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
  }
});
