import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];
  
  // Chỉ load lovable-tagger trong development mode
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