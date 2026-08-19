import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { loadEnv } from "vite";

function healthStubPlugin() {
  return {
    name: 'health-stub-plugin',
    configureServer(server) {
      server.middlewares.use('/api/openfoodfacts/search', async (req, res, next) => {
        if (req.method && req.method !== 'GET') return next();

        const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
        const requestUrl = new URL(req.url || '', 'http://localhost');
        url.searchParams.set('search_terms', requestUrl.searchParams.get('search_terms') || '');
        url.searchParams.set('search_simple', '1');
        url.searchParams.set('action', 'process');
        url.searchParams.set('json', '1');
        url.searchParams.set('page_size', requestUrl.searchParams.get('page_size') || '24');
        url.searchParams.set('fields', 'code,product_name,brands,ingredients_text,ingredients_text_en,ingredients_text_hi,ingredients_n,nutriscore_grade,nova_group,additives_tags,allergens,image_url,quantity');

        try {
          const upstream = await fetch(url.toString(), {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'FoodSafetyAi/1.0 (https://github.com/uvmanishankar/FoodSafetyAi)',
            },
          });

          const text = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
          res.setHeader('Cache-Control', 'public, max-age=60');
          res.end(text);
        } catch (error) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'OpenFoodFacts search proxy failed' }));
        }
      });

      server.middlewares.use('/api/openfoodfacts/product', async (req, res, next) => {
        if (req.method && req.method !== 'GET') return next();

        const requestUrl = new URL(req.url || '', 'http://localhost');
        const code = requestUrl.pathname.split('/').filter(Boolean).pop();
        if (!code) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing barcode' }));
          return;
        }

        const upstreamUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;

        try {
          const upstream = await fetch(upstreamUrl, {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'FoodSafetyAi/1.0 (https://github.com/uvmanishankar/FoodSafetyAi)',
            },
          });

          const text = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
          res.setHeader('Cache-Control', 'public, max-age=300');
          res.end(text);
        } catch (error) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'OpenFoodFacts product proxy failed' }));
        }
      });

      server.middlewares.use('/api/health', (_req, res, next) => {
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
