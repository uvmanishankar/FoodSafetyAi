/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MISTRAL_API_KEY: string;
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_AI_PROVIDER?: 'auto' | 'mistral' | 'groq';
  readonly VITE_MISTRAL_MODEL?: string;
  readonly VITE_GROQ_MODEL?: string;
  readonly VITE_NEWS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
