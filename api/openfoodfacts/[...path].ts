type QueryValue = string | string[] | undefined;

type ApiRequest = {
  method?: string;
  query: Record<string, QueryValue>;
};

type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  setHeader: (key: string, value: string) => ApiResponse;
  send: (body: unknown) => void;
  end: () => void;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const OPEN_FOOD_FACTS_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'FoodSafetyAi/1.0 (https://github.com/uvmanishankar/FoodSafetyAi)',
};

const OFF_CACHE_TTL = 30 * 1000; // 30 seconds
const OFF_CACHE = new Map<string, { expires: number; status: number; body: unknown }>();

async function fetchWithRetries(url: string, options?: any): Promise<Response> {
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, options);
      if (resp.ok || attempt === MAX_RETRIES || !(resp.status >= 500)) return resp;
      const backoff = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  return fetch(url, options);
}

function sendJson(res: ApiResponse, statusCode: number, body: unknown) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.send(JSON.stringify(body));
}

async function sendOpenFoodFactsResponse(res: ApiResponse, upstream: Response, cacheKey?: string) {
  const text = await upstream.text();
  const contentType = typeof upstream.headers?.get === 'function' ? (upstream.headers.get('content-type') || '') : '';

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(text);
      if (cacheKey && upstream.ok) {
        OFF_CACHE.set(cacheKey, { expires: Date.now() + OFF_CACHE_TTL, status: upstream.status, body: parsed });
      }
      sendJson(res, upstream.status, parsed);
      return;
    } catch {
      // fall through to return a friendly error
    }
  }

  if (!upstream.ok) {
    sendJson(res, upstream.status, { error: `OpenFoodFacts upstream error (${upstream.status})` });
    return;
  }

  sendJson(res, 502, { error: 'OpenFoodFacts is temporarily unavailable. Please try again shortly.' });
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const path = req.query.path;
  const segments = Array.isArray(path) ? path : typeof path === 'string' ? [path] : [];
  const [route, ...rest] = segments;

  try {
    if (route === 'search') {
      const searchTerms = typeof req.query.search_terms === 'string' ? req.query.search_terms : '';
      const pageSize = typeof req.query.page_size === 'string' ? req.query.page_size : '12';
      const offUrl = new URL('https://world.openfoodfacts.org/cgi/search.pl');
      offUrl.searchParams.set('search_terms', searchTerms);
      offUrl.searchParams.set('search_simple', '1');
      offUrl.searchParams.set('action', 'process');
      offUrl.searchParams.set('json', '1');
      offUrl.searchParams.set('page_size', pageSize);
      offUrl.searchParams.set('fields', 'code,product_name,brands,ingredients_text,ingredients_text_en,ingredients_text_hi,ingredients_n,nutriscore_grade,nova_group,additives_tags,allergens,image_url,quantity');

      const cacheKey = offUrl.toString();
      const cached = OFF_CACHE.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        sendJson(res, cached.status, cached.body);
        return;
      }

      const upstream = await fetchWithRetries(offUrl.toString(), { headers: OPEN_FOOD_FACTS_HEADERS });
      await sendOpenFoodFactsResponse(res, upstream, cacheKey);
      return;
    }

    if (route === 'product' && rest.length >= 1) {
      const code = rest[0];
      const prodUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;
      const cacheKey = prodUrl;
      const cached = OFF_CACHE.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        sendJson(res, cached.status, cached.body);
        return;
      }

      const upstream = await fetchWithRetries(prodUrl, { headers: OPEN_FOOD_FACTS_HEADERS });
      await sendOpenFoodFactsResponse(res, upstream, cacheKey);
      return;
    }

    sendJson(res, 404, { error: 'Unknown OpenFoodFacts route' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to proxy OpenFoodFacts request';
    sendJson(res, 502, { error: message });
  }
}
