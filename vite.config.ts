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
    // Explicitly prevent Next.js resolution
    conditions: ['import', 'module', 'browser', 'default'],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      external: [
        // Exclude all Next.js related modules
        /^next($|\/)/,
        /^next-themes($|\/)/,
        /^@next($|\/)/,
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
      'recharts'
    ],
    // Explicitly exclude Next.js and related packages
    exclude: [
      'next',
      'next-themes',
      'next/router',
      'next/head',
      'next/image',
      'next/link',
      'next/script',
      '@next/env',
      '@next/swc-darwin-x64',
      '@next/swc-linux-x64-gnu',
      '@next/swc-win32-x64-msvc'
    ]
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Prevent Next.js globals
    'process.env.__NEXT_ROUTER_BASEPATH': 'undefined',
    'process.env.__NEXT_I18N_SUPPORT': 'undefined',
  },
  server: {
    fs: {
      // Deny access to Next.js directories
      deny: [
        '.next',
        'next.config.js',
        'next.config.mjs',
        'next.config.ts'
      ]
    }
  }
})