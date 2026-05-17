/**
 * AI API helper
 * ──────────────────────────────────────────────────────────────────────────
 * Centralised function to call Mistral or Groq.
 * Prefers the configured provider, retries rate limits, and falls back to the
 * other provider when the first one is unavailable.
 */

const MISTRAL_KEY = (import.meta.env.VITE_MISTRAL_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '').trim();
const GROQ_KEY = (import.meta.env.VITE_GROQ_API_KEY || '').trim();
const AI_PROVIDER = (import.meta.env.VITE_AI_PROVIDER || 'auto').trim().toLowerCase();
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Maximum number of retries for rate-limit (429) errors */
const MAX_RETRIES = 3;

/** Helper: sleep for `ms` milliseconds */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse the retry delay from the API error body, or return a default backoff.
 * Returns exponential backoff.
 */
function parseRetryDelay(errorBody: string, attempt: number): number {
  // Exponential backoff: 5s, 15s, 30s
  return Math.min(5000 * Math.pow(3, attempt), 30_000);
}

type AIProvider = 'mistral' | 'groq';

interface ProviderConfig {
  key: string;
  url: string;
  model: string;
  label: string;
}

const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  mistral: {
    key: MISTRAL_KEY,
    url: MISTRAL_URL,
    model: import.meta.env.VITE_MISTRAL_MODEL?.trim() || 'mistral-small-latest',
    label: 'Mistral',
  },
  groq: {
    key: GROQ_KEY,
    url: GROQ_URL,
    model: import.meta.env.VITE_GROQ_MODEL?.trim() || 'llama-3.1-8b-instant',
    label: 'Groq',
  },
};

function getProviderOrder(): AIProvider[] {
  if (AI_PROVIDER === 'groq') return ['groq', 'mistral'];
  if (AI_PROVIDER === 'mistral') return ['mistral', 'groq'];
  return ['groq', 'mistral'];
}

function shouldFallback(status: number): boolean {
  return status === 401 || status === 403 || status === 404 || status >= 500;
}

async function callViaServerProxy(messages: MistralMessage[]): Promise<string | null> {
  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
        max_tokens: 1200,
        top_p: 0.9,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export interface MistralMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Custom error class to distinguish quota exhaustion from transient rate-limits */
export class MistralQuotaError extends Error {
  retryAfterMs: number;
  isQuotaExhausted: boolean;

  constructor(message: string, retryAfterMs: number, isQuotaExhausted: boolean) {
    super(message);
    this.name = 'MistralQuotaError';
    this.retryAfterMs = retryAfterMs;
    this.isQuotaExhausted = isQuotaExhausted;
  }
}

export async function callGemini(
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): Promise<string> {
  const providerOrder = getProviderOrder();
  const availableProviders = providerOrder.filter(provider => PROVIDERS[provider].key);

  // Build the full message list
  const messages: MistralMessage[] = [];
  
  // Add system prompt as first user message if needed
  if (systemPrompt) {
    messages.push({ role: 'user', content: systemPrompt });
    messages.push({ role: 'assistant', content: 'Understood. I will follow these instructions.' });
  }
  
  // Add history
  for (const msg of history) {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  }
  
  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  const proxyResponse = await callViaServerProxy(messages);
  if (proxyResponse) return proxyResponse;

  if (!availableProviders.length) {
    throw new Error('Missing AI API key. Set MISTRAL_API_KEY or GROQ_API_KEY on the server (recommended), or VITE_MISTRAL_API_KEY / VITE_GROQ_API_KEY for direct client calls.');
  }

  const body = {
    messages,
    temperature: 0.7,
    max_tokens: 1200,
    top_p: 0.9,
  };

  let lastError: string | null = null;

  for (const provider of availableProviders) {
    const config = PROVIDERS[provider];
    const payload = JSON.stringify({ ...body, model: config.model });

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.key}`,
        },
        body: payload,
      });

      if (response.ok) {
        const data = await response.json();
        return data?.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response right now.';
      }

      const errText = await response.text();
      lastError = `${config.label} API error (${response.status}): ${errText}`;

      if (response.status === 429) {
        const isQuotaExhausted = errText.includes('quota') || errText.includes('limit');
        const retryMs = parseRetryDelay(errText, attempt);

        if (isQuotaExhausted) {
          console.error(`${config.label} API: Quota exhausted.`);
          throw new MistralQuotaError(
            `${config.label} API quota has been exhausted. Please wait a moment and try again.`,
            retryMs,
            true,
          );
        }

        if (attempt < MAX_RETRIES) {
          console.warn(`${config.label} API rate limited (429). Retrying in ${retryMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(retryMs);
          continue;
        }

        throw new MistralQuotaError(
          `${config.label} API rate limit exceeded. Please wait a moment and try again.`,
          retryMs,
          false,
        );
      }

      if (shouldFallback(response.status) && provider !== availableProviders[availableProviders.length - 1]) {
        console.warn(`${config.label} API returned ${response.status}; trying fallback provider.`);
        break;
      }

      console.error(`${config.label} API error:`, response.status, errText);
      throw new Error(`${config.label} API error (${response.status}): ${errText}`);
    }
  }

  throw new Error(lastError ?? 'Unexpected error in AI API call');
}
