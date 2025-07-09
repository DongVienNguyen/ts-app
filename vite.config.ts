import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      external: [
        // Exclude Next.js from bundling
        /^next($|\/)/,
      ],
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'lucide-react',
      'date-fns',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
      'sonner',
      'recharts',
      'use-local-storage-state'
    ],
    // Explicitly exclude Next.js and related packages
    exclude: [
      'next',
      'next-themes',
      'next/router',
      'next/head',
      'next/image',
      'next/link',
      'next/script'
    ]
  },
  // Ensure we're not accidentally importing Next.js modules
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})