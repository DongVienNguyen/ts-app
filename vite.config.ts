import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    }),
    
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    }),
    
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    // Target modern browsers for better optimization
    target: 'es2020',
    
    // Use esbuild for faster minification
    minify: 'esbuild',
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    
    // Source maps for production debugging (optional)
    sourcemap: false,
    
    // Asset optimization
    assetsInlineLimit: 4096,
    
    rollupOptions: {
      output: {
        // Optimize chunk naming with content hash
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/woff2?|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        
        // Advanced code splitting strategy
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            
            // Data fetching
            if (id.includes('@tanstack/react-query') || id.includes('@supabase')) {
              return 'data-vendor';
            }
            
            // Routing
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            
            // Utilities
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
            
            // Large libraries
            if (id.includes('jszip')) {
              return 'jszip-vendor';
            }
            
            // Other vendors
            return 'vendor';
          }
          
          // App chunks
          if (id.includes('/pages/')) {
            // Heavy admin pages
            if (id.includes('DataManagement') || 
                id.includes('SecurityMonitor') || 
                id.includes('ErrorMonitoring') || 
                id.includes('UsageMonitoring') || 
                id.includes('SystemBackup')) {
              return 'admin-pages';
            }
            
            // Regular pages
            return 'pages';
          }
          
          // Components
          if (id.includes('/components/')) {
            if (id.includes('/ui/')) {
              return 'ui-components';
            }
            return 'components';
          }
          
          // Hooks
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
          
          // Services
          if (id.includes('/services/')) {
            return 'services';
          }
        }
      },
      
      // Rollup options for better tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    }
  },
  
  // Development server optimization
  server: {
    port: 32100,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    
    // Optimize HMR
    hmr: {
      port: 32101,
      overlay: false
    }
  },
  
  // Preview server (production testing)
  preview: {
    port: 7000,
    host: '0.0.0.0',
    strictPort: true,
    cors: true
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ],
    exclude: [
      '@vite/client',
      '@vite/env'
    ],
    
    // Force optimization for problematic packages
    force: true
  },
  
  // Define global constants
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  
  // CSS optimization
  css: {
    devSourcemap: true
  }
})