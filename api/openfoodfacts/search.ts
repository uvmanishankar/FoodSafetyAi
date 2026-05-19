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

function getQueryString(value: QueryValue, fallback = '') {
  return Array.isArray(value) ? value[0] || fallback : value || fallback;
}

function sendJson(res: ApiResponse, statusCode: number, body: unknown) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.send(JSON.stringify(body));
}

async function sendOpenFoodFactsResponse(res: ApiResponse, upstream: Response) {
  const text = await upstream.text();
  const contentType = typeof upstream.headers?.get === 'function' ? (upstream.headers.get('content-type') || '') : '';

  if (contentType.includes('application/json')) {
    try {
      sendJson(res, upstream.status, JSON.parse(text));
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

  try {
    const offUrl = new URL('https://world.openfoodfacts.org/cgi/search.pl');
    offUrl.searchParams.set('search_terms', getQueryString(req.query.search_terms));
    offUrl.searchParams.set('search_simple', '1');
    offUrl.searchParams.set('action', 'process');
    offUrl.searchParams.set('json', '1');
    offUrl.searchParams.set('page_size', getQueryString(req.query.page_size, '12'));
    offUrl.searchParams.set('fields', 'code,product_name,brands,ingredients_text,ingredients_text_en,ingredients_text_hi,ingredients_n,nutriscore_grade,nova_group,additives_tags,allergens,image_url,quantity');

    const upstream = await fetch(offUrl.toString(), { headers: OPEN_FOOD_FACTS_HEADERS });
    await sendOpenFoodFactsResponse(res, upstream);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to proxy OpenFoodFacts search';
    sendJson(res, 502, { error: message });
  }
}
