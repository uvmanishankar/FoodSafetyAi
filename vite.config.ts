import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { loadEnv } from "vite";

function healthStubPlugin() {
  return {
    name: 'health-stub-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/health', (_req: any, res: any, next: any) => {
        if (_req.method && _req.method !== 'GET') return next();

        const body = JSON.stringify({
          ok: true,
          dev: true,
          timestamp: Date.now(),
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(body);
      });
    },
  };
}

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
      '/api/openfoodfacts/search': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        rewrite: () => '/cgi/search.pl',
      },
      '/api/openfoodfacts/product': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openfoodfacts\/product/, '/api/v2/product') + '.json',
      },
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
  plugins: [healthStubPlugin(), react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
