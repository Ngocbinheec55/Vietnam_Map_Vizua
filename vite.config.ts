import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // Load env từ cả file .env (local) và biến môi trường (GitHub Actions)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // PHẢI khớp với tên Repo trên thanh địa chỉ trình duyệt
    base: '/Vietnam_Map_Vizua/', 
    plugins: [react(), tailwindcss()],
    define: {
      // Hỗ trợ cả khi chạy local và khi build trên GitHub
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
  };
});
