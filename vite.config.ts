import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Tối ưu cho production
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    // Cache busting - tạo hash mới mỗi lần build
    rollupOptions: {
      output: {
        // Tạo hash cho tất cả files
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        
        // Code splitting tối ưu
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          router: ['react-router-dom'],
          utils: ['clsx', 'tailwind-merge', 'date-fns']
        }
      }
    },
    
    // Chunk size optimization
    chunkSizeWarningLimit: 1000,
    
    // Source maps cho debugging (tắt trong production)
    sourcemap: false,
    
    // Asset optimization
    assetsInlineLimit: 4096,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Preload optimization
    modulePreload: {
      polyfill: true
    }
  },
  
  // Development server with WebSocket fix
  server: {
    port: 32100,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    // Fix WebSocket HMR issues
    hmr: {
      port: 32101,
      overlay: false
    }
  },
  
  // Preview server (for production testing)
  preview: {
    port: 7000,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'react-router-dom'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Define global constants
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
})