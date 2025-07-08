import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      // which is necessary for pnpm's symlinked dependency structure.
      allow: ['..'],
    },
  },
})