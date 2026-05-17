type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  setHeader: (key: string, value: string) => ApiResponse;
  send: (body: unknown) => void;
  end: () => void;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const AI_PROVIDER = (process.env.AI_PROVIDER || process.env.VITE_AI_PROVIDER || 'auto').trim().toLowerCase();

function sendJson(res: ApiResponse, statusCode: number, body: unknown) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.send(JSON.stringify(body));
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const mistralKey = (process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '').trim();

  const order = AI_PROVIDER === 'mistral' ? ['mistral', 'groq'] : AI_PROVIDER === 'groq' ? ['groq', 'mistral'] : ['groq', 'mistral'];

  const providers = order
    .map((name) => name === 'groq'
      ? { name, key: groqKey, url: GROQ_URL, model: process.env.GROQ_MODEL || process.env.VITE_GROQ_MODEL || 'llama-3.1-8b-instant' }
      : { name, key: mistralKey, url: MISTRAL_URL, model: process.env.MISTRAL_MODEL || process.env.VITE_MISTRAL_MODEL || 'mistral-small-latest' })
    .filter((p) => p.key);

  if (!providers.length) return sendJson(res, 500, { error: 'Missing server AI key. Set MISTRAL_API_KEY or GROQ_API_KEY.' });

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    for (const p of providers) {
      const upstream = await fetch(p.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${p.key}`,
        },
        body: JSON.stringify({ ...payload, model: p.model }),
      });

      const text = await upstream.text();
      if (upstream.ok) {
        res.status(200).setHeader('Content-Type', 'application/json').send(text);
        return;
      }
      if (![401, 403, 404].includes(upstream.status) && upstream.status < 500) {
        return sendJson(res, upstream.status, { error: text });
      }
    }

    return sendJson(res, 502, { error: 'All AI providers failed.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI proxy failed';
    return sendJson(res, 500, { error: message });
  }
}
