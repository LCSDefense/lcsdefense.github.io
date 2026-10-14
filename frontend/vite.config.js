import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_API_URL ? '/lcs-recruiting-portal/' : '/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
