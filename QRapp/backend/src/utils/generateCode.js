// Sinh mã lớp ngắn, dễ đọc: A–Z + số 2–9 (bỏ 0,1 cho đỡ nhầm)
function generateClassCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

module.exports = { generateClassCode };
