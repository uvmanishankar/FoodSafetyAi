import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const newsApiKey = env.NEWS_API_KEY || env.VITE_NEWS_API_KEY;

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api/news': {
        target: 'https://newsapi.org',
        changeOrigin: true,
        headers: newsApiKey
          ? {
              'X-Api-Key': newsApiKey,
            }
          : undefined,
        rewrite: (path) => path.replace(/^\/api\/news/, ''),
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
