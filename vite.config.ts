import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/Quizlet/' : '/',
  // Her build'de farklı timestamp → CDN cache'i kırar
  define: {
    __BUILD_TIME__: JSON.stringify(Date.now()),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
