import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@modules': path.resolve(__dirname, './src/modules'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://sistemapos-dian.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
