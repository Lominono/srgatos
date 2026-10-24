import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5188,
    strictPort: true,
    open: false,
    host: true,
    watch: {
      ignored: ['**/video/**', '**/public/video/**']
    }
  },
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap']
        }
      }
    }
  }
});
