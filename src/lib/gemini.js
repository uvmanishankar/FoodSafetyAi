/**
 * AI API helper
 *
 * All provider calls go through /api/ai-chat so API keys stay on the server.
 */

function getProviderOrder() {
  const provider = (import.meta.env.VITE_AI_PROVIDER || 'auto').trim().toLowerCase();
  if (provider === 'mistral') return ['mistral', 'groq'];
  if (provider === 'groq') return ['groq', 'mistral'];
  return ['groq', 'mistral'];
}

function buildProviderConfigs() {
  return {
    mistral: {
      key: (import.meta.env.VITE_MISTRAL_API_KEY || '').trim(),
      url: 'https://api.mistral.ai/v1/chat/completions',
      model: (import.meta.env.VITE_MISTRAL_MODEL || 'mistral-small-latest').trim(),
      label: 'Mistral',
    },
    groq: {
      key: (import.meta.env.VITE_GROQ_API_KEY || '').trim(),
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: (import.meta.env.VITE_GROQ_MODEL || 'llama-3.1-8b-instant').trim(),
      label: 'Groq',
    },
  };
}

function friendlyProxyError(detail) {
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

async function readErrorDetail(response) {
  const text = await response.text().catch(() => '');

  if (!text) return '';

  try {
    const data = JSON.parse(text);
    return typeof data.error === 'string' ? data.error : text;
  } catch {
    return text;
  }
}

async function callViaServerProxy(messages) {
  let response;

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
    if (response.status >= 500 || response.status === 429) {
      console.warn('Server proxy /api/ai-chat returned', response.status, detail);
    }
    throw new Error(friendlyProxyError(detail));
  }

  const data = await response.json().catch((error) => {
    console.warn('Failed to parse /api/ai-chat JSON response:', error);
    return null;
  });

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('AI service returned an empty response. Please try again.');
  }

  return content;
}

async function callDirectProvider(messages, providerName) {
  const providers = buildProviderConfigs();
  const provider = providers[providerName];

  if (!provider.key) {
    throw new Error(`${provider.label} client key is not configured.`);
  }

  if (!provider.url) {
    throw new Error(`${provider.label} provider URL is invalid.`);
  }

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      messages,
      model: provider.model,
      temperature: 0.7,
      max_tokens: 1200,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(friendlyProxyError(detail));
  }

  const data = await response.json().catch((error) => {
    console.warn(`Failed to parse ${provider.label} JSON response:`, error);
    return null;
  });

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`${provider.label} returned an empty response. Please try again.`);
  }

  return content;
}

export async function callGemini(systemPrompt, history, userMessage) {
  const messages = [];

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

  try {
    return await callViaServerProxy(messages);
  } catch (proxyError) {
    const providers = buildProviderConfigs();
    const providerOrder = getProviderOrder();
    const availableProviders = providerOrder.filter((name) => providers[name].key);

    if (!availableProviders.length) {
      throw proxyError instanceof Error ? proxyError : new Error('AI service unavailable. Please try again later.');
    }

    for (const providerName of availableProviders) {
      try {
        return await callDirectProvider(messages, providerName);
      } catch (error) {
        console.warn(`Direct ${providerName} AI fallback failed:`, error);
      }
    }

    throw proxyError instanceof Error ? proxyError : new Error('AI service unavailable. Please try again later.');
  }
}
