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

function sendJson(res: ApiResponse, statusCode: number, body: unknown) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.send(JSON.stringify(body));
}

function envValue(name: string, fallback = '') {
  return (process.env[name] || fallback).trim();
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const aiProvider = envValue('AI_PROVIDER', 'auto').toLowerCase();
  const mistralKey = envValue('MISTRAL_API_KEY');
  const groqKey = envValue('GROQ_API_KEY');

  // Diagnostic: log which keys are present (do not log values)
  try {
    console.info('AI key presence:', {
      mistral: !!mistralKey,
      groq: !!groqKey,
      provider: aiProvider,
    });
  } catch {
    // ignore logging errors in restricted envs
  }

  const order = aiProvider === 'mistral' ? ['mistral', 'groq'] : aiProvider === 'groq' ? ['groq', 'mistral'] : ['groq', 'mistral'];

  const providers = order
    .map((name) => name === 'groq'
      ? { name, key: groqKey, url: GROQ_URL, model: envValue('GROQ_MODEL', 'llama-3.1-8b-instant') }
      : { name, key: mistralKey, url: MISTRAL_URL, model: envValue('MISTRAL_MODEL', 'mistral-small-latest') })
    .filter((p) => p.key);

  if (!providers.length) return sendJson(res, 500, { error: 'Missing server AI key. Set MISTRAL_API_KEY or GROQ_API_KEY.' });

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    for (const p of providers) {
      try {
        const bodyStr = JSON.stringify({ ...payload, model: p.model });
        const upstream = await fetch(p.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${p.key}`,
          },
          body: bodyStr,
        });

        const text = await upstream.text();
        // Log provider response (non-sensitive): status + truncated body
        try {
          console.info(`AI provider ${p.name} responded:`, { status: upstream.status, body: String(text).slice(0, 1000) });
        } catch {
          // ignore logging errors in restricted envs
        }

        if (upstream.ok) {
          res.status(200).setHeader('Content-Type', 'application/json').send(text);
          return;
        }

        if (![401, 403, 404].includes(upstream.status) && upstream.status < 500) {
          return sendJson(res, upstream.status, { error: text });
        }
      } catch (provErr) {
        // Log the provider fetch error and try next provider
        console.error(`Error calling AI provider ${p.name}:`, provErr && (provErr.stack || provErr.message || provErr));
        continue;
      }
    }

    return sendJson(res, 502, { error: 'All AI providers failed.' });
  } catch (error) {
    // Log full error stack for diagnostics (no secrets)
    console.error('AI proxy handler error:', error && (error.stack || error.message || error));
    const message = error instanceof Error ? error.message : 'AI proxy failed';
    return sendJson(res, 500, { error: message });
  }
}
