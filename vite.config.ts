import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Production: /Quizlet/ for GitHub Pages
  // Development: / for local dev server
  base: mode === 'production' ? '/Quizlet/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    // PWA plugin will be added in Checkpoint C after the core app is stable
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
