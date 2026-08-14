import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [react(), svgr(), compression({ algorithm: 'gzip', threshold: 1024 })],
  server: { port: 5173 },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor':    ['lucide-react', 'react-toastify'],
          'http-vendor':  ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
