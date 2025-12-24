import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: dùng đường dẫn tương đối để tránh lỗi 404 assets khi deploy static
  // (đặc biệt khi publish directory không đúng hoặc khi chạy dưới sub-path)
  base: "./",
});
