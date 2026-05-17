import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJson(res: VercelResponse, statusCode: number, body: unknown) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.send(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      offUrl.searchParams.set('fields', 'code,product_name,brands,ingredients_text,ingredients_n,nutriscore_grade,nova_group,additives_tags,allergens,image_url,quantity');

      const upstream = await fetch(offUrl.toString());
      const data = await upstream.json();
      sendJson(res, upstream.status, data);
      return;
    }

    if (route === 'product' && rest.length >= 1) {
      const code = rest[0];
      const upstream = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
      const data = await upstream.json();
      sendJson(res, upstream.status, data);
      return;
    }

    sendJson(res, 404, { error: 'Unknown OpenFoodFacts route' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to proxy OpenFoodFacts request';
    sendJson(res, 502, { error: message });
  }
}