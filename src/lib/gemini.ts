/**
 * Gemini Flash API helper
 * ──────────────────────────────────────────────────────────────────────────
 * Centralised function to call Google Gemini Flash API.
 * The API key is read from VITE_GEMINI_API_KEY env variable.
 * Includes automatic retry with exponential backoff for 429 rate-limit errors.
 */

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

/** Maximum number of retries for rate-limit (429) errors */
const MAX_RETRIES = 3;

/** Helper: sleep for `ms` milliseconds */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse the retry delay from the API error body, or return a default backoff.
 * The Gemini API returns a retryDelay like "27s" inside the error details.
 */
function parseRetryDelay(errorBody: string, attempt: number): number {
  try {
    const parsed = JSON.parse(errorBody);
    const retryInfo = parsed?.error?.details?.find(
      (d: any) => d['@type']?.includes('RetryInfo'),
    );
    if (retryInfo?.retryDelay) {
      const seconds = parseFloat(retryInfo.retryDelay);
      if (!isNaN(seconds)) return Math.ceil(seconds * 1000);
    }
  } catch { /* ignore parse errors */ }
  // Exponential backoff: 5s, 15s, 30s
  return Math.min(5000 * Math.pow(3, attempt), 30_000);
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

/** Custom error class to distinguish quota exhaustion from transient rate-limits */
export class GeminiQuotaError extends Error {
  retryAfterMs: number;
  isQuotaExhausted: boolean;

  constructor(message: string, retryAfterMs: number, isQuotaExhausted: boolean) {
    super(message);
    this.name = 'GeminiQuotaError';
    this.retryAfterMs = retryAfterMs;
    this.isQuotaExhausted = isQuotaExhausted;
  }
}

export async function callGemini(
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): Promise<string> {
  // Build the full message list — add userMessage only if it's not already the last item
  const histCopy = [...history];
  const last = histCopy[histCopy.length - 1];
  if (!last || last.role !== 'user' || last.content !== userMessage) {
    histCopy.push({ role: 'user', content: userMessage });
  }

  // Convert to Gemini format
  const allMessages: GeminiMessage[] = histCopy.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Gemini requires:
  //  1. First turn must be 'user'
  //  2. No consecutive messages from the same role
  // Skip leading 'model' messages (welcome messages), merge consecutive same-role messages
  const contents: GeminiMessage[] = [];
  for (const msg of allMessages) {
    if (contents.length === 0 && msg.role === 'model') continue;
    const prev = contents[contents.length - 1];
    if (prev && prev.role === msg.role) {
      prev.parts[0].text += '\n\n' + msg.parts[0].text;
    } else {
      contents.push({ ...msg, parts: [{ text: msg.parts[0].text }] });
    }
  }

  if (contents.length === 0) {
    return 'Please type a message to get started!';
  }

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1200,
      topP: 0.9,
    },
  };

  const payload = JSON.stringify(body);

  // Retry loop for 429 rate-limit errors
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });

    if (response.ok) {
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response right now.';
    }

    const errText = await response.text();

    if (response.status === 429) {
      // Check if this is a daily quota exhaustion (limit: 0) vs a per-minute rate limit
      const isDailyQuotaExhausted = errText.includes('limit: 0');
      const retryMs = parseRetryDelay(errText, attempt);

      if (isDailyQuotaExhausted) {
        console.error('Gemini API: Free-tier daily quota exhausted.');
        throw new GeminiQuotaError(
          'Your Gemini API free-tier daily quota has been exhausted. Please wait until the quota resets (usually within 24 hours), or upgrade to a paid plan at https://ai.google.dev.',
          retryMs,
          true,
        );
      }

      // Transient rate limit — retry with backoff
      if (attempt < MAX_RETRIES) {
        console.warn(`Gemini API rate limited (429). Retrying in ${retryMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(retryMs);
        continue;
      }

      // All retries exhausted
      throw new GeminiQuotaError(
        'Gemini API rate limit exceeded. Please wait a moment and try again.',
        retryMs,
        false,
      );
    }

    // Non-429 errors — don't retry
    console.error('Gemini API error:', response.status, errText);
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  // Should never reach here, but just in case
  throw new Error('Unexpected error in Gemini API call');
}
