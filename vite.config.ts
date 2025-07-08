import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true, // Enable PWA features in development
      },
      // Use the injectManifest strategy to use our own service worker logic
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts', // our custom service worker file
      manifest: {
        name: 'Hệ thống Thông báo TS',
        short_name: 'Thông báo TS',
        description: 'Hệ thống quản lý tài sản và thông báo mượn/xuất tài sản',
        theme_color: '#4ade80',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo192.png', // Ensure this icon exists in the public folder
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo512.png', // Ensure this icon exists in the public folder
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    })
  ];
  
  // Only load lovable-tagger in development mode
  if (mode === 'development') {
    try {
      const { componentTagger } = await import('lovable-tagger');
      plugins.push(componentTagger() as any);
    } catch (error) {
      console.warn('Could not load lovable-tagger:', error.message);
    }
  }

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});