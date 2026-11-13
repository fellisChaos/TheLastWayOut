import { defineConfig } from 'vite'
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 2500, target: 'es2020' },
  server: { host: '0.0.0.0', port: 3000 }
})
