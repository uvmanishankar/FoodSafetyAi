/**
 * Mistral API helper
 * ──────────────────────────────────────────────────────────────────────────
 * Centralised function to call Mistral API.
 * The API key is read from VITE_MISTRAL_API_KEY env variable.
 * Includes automatic retry with exponential backoff for 429 rate-limit errors.
 */

const MISTRAL_KEY = import.meta.env.VITE_MISTRAL_API_KEY as string;
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

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

  const body = {
    model: 'mistral-small-latest',
    messages,
    temperature: 0.7,
    max_tokens: 1200,
    top_p: 0.9,
  };

  const payload = JSON.stringify(body);

  // Retry loop for 429 rate-limit errors
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_KEY}`,
      },
      body: payload,
    });

    if (response.ok) {
      const data = await response.json();
      return data?.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response right now.';
    }

    const errText = await response.text();

    if (response.status === 429) {
      // Check if this is quota exhaustion
      const isQuotaExhausted = errText.includes('quota') || errText.includes('limit');
      const retryMs = parseRetryDelay(errText, attempt);

      if (isQuotaExhausted) {
        console.error('Mistral API: Quota exhausted.');
        throw new MistralQuotaError(
          'Mistral API quota has been exhausted. Please wait a moment and try again.',
          retryMs,
          true,
        );
      }

      // Transient rate limit — retry with backoff
      if (attempt < MAX_RETRIES) {
        console.warn(`Mistral API rate limited (429). Retrying in ${retryMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(retryMs);
        continue;
      }

      // All retries exhausted
      throw new MistralQuotaError(
        'Mistral API rate limit exceeded. Please wait a moment and try again.',
        retryMs,
        false,
      );
    }

    // Non-429 errors — don't retry
    console.error('Mistral API error:', response.status, errText);
    throw new Error(`Mistral API error (${response.status}): ${errText}`);
  }

  // Should never reach here, but just in case
  throw new Error('Unexpected error in Mistral API call');
}
