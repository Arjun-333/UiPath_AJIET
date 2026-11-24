import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/app/',
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      },
      '/assets': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/media': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
