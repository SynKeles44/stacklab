/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const target = process.env.STACKLAB_PROXY_TARGET ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    assetsDir: 'static',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        runner: path.resolve(import.meta.dirname, 'runner.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': target,
      '/assets': target,
      '/screenshots': target,
      '/terminal': { target, ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
  },
})
