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

const OFF_CACHE_TTL = 60 * 1000; // 60 seconds
const OFF_CACHE = new Map<string, { expires: number; status: number; body: unknown }>();

function getQuery(value: QueryValue, fallback = '') {
  return Array.isArray(value) ? (value[0] || fallback) : (value || fallback);
}

function sendJson(res: ApiResponse, statusCode: number, body: unknown) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.send(JSON.stringify(body));
}

async function fetchWithRetries(url: string, options?: RequestInit): Promise<Response> {
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, options);
      if (resp.ok || attempt === MAX_RETRIES || resp.status < 500) return resp;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  return fetch(url, options);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { sendJson(res, 405, { error: 'Method not allowed' }); return; }

  try {
    const offUrl = new URL('https://world.openfoodfacts.org/cgi/search.pl');
    offUrl.searchParams.set('search_terms', getQuery(req.query.search_terms));
    offUrl.searchParams.set('search_simple', '1');
    offUrl.searchParams.set('action', 'process');
    offUrl.searchParams.set('json', '1');
    offUrl.searchParams.set('page_size', getQuery(req.query.page_size, '24'));
    offUrl.searchParams.set('fields', 'code,product_name,brands,ingredients_text,ingredients_text_en,ingredients_text_hi,ingredients_n,nutriscore_grade,nova_group,additives_tags,allergens,image_url,quantity');

    const cacheKey = offUrl.toString();
    const cached = OFF_CACHE.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      try { res.setHeader('Cache-Control', 'public, max-age=60'); } catch {}
      sendJson(res, cached.status as number, cached.body);
      return;
    }

    const upstream = await fetchWithRetries(offUrl.toString(), { headers: OPEN_FOOD_FACTS_HEADERS });
    const text = await upstream.text();
    const contentType = typeof upstream.headers?.get === 'function' ? (upstream.headers.get('content-type') || '') : '';

    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(text);
        if (upstream.ok) {
          OFF_CACHE.set(cacheKey, { expires: Date.now() + OFF_CACHE_TTL, status: upstream.status, body: parsed });
          try { res.setHeader('Cache-Control', 'public, max-age=60'); } catch {}
        }
        sendJson(res, upstream.status, parsed);
        return;
      } catch {}
    }

    if (!upstream.ok) {
      sendJson(res, upstream.status, { error: `OpenFoodFacts upstream error (${upstream.status})` });
      return;
    }

    sendJson(res, 502, { error: 'OpenFoodFacts is temporarily unavailable. Please try again shortly.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search OpenFoodFacts';
    sendJson(res, 502, { error: message });
  }
}
