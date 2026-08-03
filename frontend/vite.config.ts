import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // 개발 중에는 /api 요청을 백엔드(8080)로 프록시해 같은 오리진으로 만든다.
    // → CORS/쿠키 이슈 없이 세션 쿠키가 그대로 오간다. (운영은 VITE_API_BASE 로 분리)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
