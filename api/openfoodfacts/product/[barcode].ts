type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
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

const OFF_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for product lookups
const OFF_CACHE = new Map<string, { expires: number; status: number; body: unknown }>();

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

  // Vercel passes the dynamic segment as req.query.barcode
  const barcode = Array.isArray(req.query.barcode) ? req.query.barcode[0] : req.query.barcode;

  if (!barcode) {
    sendJson(res, 400, { error: 'Missing barcode' });
    return;
  }

  try {
    const prodUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;

    const cached = OFF_CACHE.get(prodUrl);
    if (cached && cached.expires > Date.now()) {
      try { res.setHeader('Cache-Control', 'public, max-age=300'); } catch {}
      sendJson(res, cached.status as number, cached.body);
      return;
    }

    const upstream = await fetchWithRetries(prodUrl, { headers: OPEN_FOOD_FACTS_HEADERS });
    const text = await upstream.text();
    const contentType = typeof upstream.headers?.get === 'function' ? (upstream.headers.get('content-type') || '') : '';

    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(text);
        if (upstream.ok) {
          OFF_CACHE.set(prodUrl, { expires: Date.now() + OFF_CACHE_TTL, status: upstream.status, body: parsed });
          try { res.setHeader('Cache-Control', 'public, max-age=300'); } catch {}
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
    const message = error instanceof Error ? error.message : 'Failed to fetch product from OpenFoodFacts';
    sendJson(res, 502, { error: message });
  }
}
