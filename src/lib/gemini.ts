/**
 * AI API helper
 *
 * All provider calls go through /api/ai-chat so API keys stay on the server.
 */

export interface MistralMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function friendlyProxyError(detail?: string): string {
  const message = detail?.trim() || '';

  if (/missing server ai key/i.test(message)) {
    return 'AI assistant is not configured yet. Add GROQ_API_KEY or MISTRAL_API_KEY in Vercel and redeploy.';
  }

  if (/quota/i.test(message)) {
    return 'AI assistant quota has been reached. Please try again later.';
  }

  if (/rate.?limit|too many requests|429/i.test(message)) {
    return 'AI assistant is receiving too many requests. Please wait a moment and try again.';
  }

  return 'AI service unavailable. Please try again later.';
}

async function readErrorDetail(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');

  if (!text) return '';

  try {
    const data = JSON.parse(text) as { error?: unknown };
    return typeof data.error === 'string' ? data.error : text;
  } catch {
    return text;
  }
}

async function callViaServerProxy(messages: MistralMessage[]): Promise<string> {
  let response: Response;

  try {
    response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
        max_tokens: 1200,
        top_p: 0.9,
      }),
    });
  } catch (error) {
    console.warn('Server proxy /api/ai-chat request failed:', error);
    throw new Error('AI service unavailable. Please try again later.');
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    console.warn('Server proxy /api/ai-chat returned', response.status, detail);
    throw new Error(friendlyProxyError(detail));
  }

  const data = await response.json().catch((error) => {
    console.warn('Failed to parse /api/ai-chat JSON response:', error);
    return null;
  }) as ChatCompletionResponse | null;

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('AI service returned an empty response. Please try again.');
  }

  return content;
}

export async function callGemini(
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): Promise<string> {
  const messages: MistralMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'user', content: systemPrompt });
    messages.push({ role: 'assistant', content: 'Understood. I will follow these instructions.' });
  }

  for (const msg of history) {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  return callViaServerProxy(messages);
}
