import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/github-login': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/github-login/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react';
            }
            if (
              id.includes('@codemirror/') ||
              id.includes('@uiw/react-codemirror')
            ) {
              return 'vendor-codemirror';
            }
            if (id.includes('@octokit/')) {
              return 'vendor-octokit';
            }
          }
        },
      },
    },
  },
});