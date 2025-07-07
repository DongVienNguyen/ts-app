import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  //base: '/ts-app/',
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'logo192.png', 'logo512.png', 'apple-touch-icon.png', 'screenshot-desktop.png', 'screenshot-mobile.png'],
      manifest: {
        name: 'Hệ thống Thông báo TS',
        short_name: 'Thông báo TS',
        description: 'Hệ thống quản lý tài sản và thông báo mượn/xuất tài sản',
        theme_color: '#4ade80',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot-desktop.png',
            sizes: '1920x1080', // Kích thước ảnh chụp màn hình desktop của bạn
            type: 'image/png',
            form_factor: 'wide',
            label: 'Giao diện trên máy tính'
          },
          {
            src: 'screenshot-mobile.png',
            sizes: '750x1334', // Kích thước ảnh chụp màn hình mobile của bạn
            type: 'image/png',
            label: 'Giao diện trên điện thoại'
          }
        ]
      },
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));