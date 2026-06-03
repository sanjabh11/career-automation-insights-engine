// setupEnv.ts
// Captures Vite-provided environment variables at module evaluation time
// and makes them available on the global object for runtime access by helpers

const runtimeEnvSnapshot: Record<string, string | undefined> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_URL: import.meta.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.SUPABASE_ANON_KEY,
};

type CareerAutomationRuntimeEnv = Record<string, string | undefined>;

declare global {
  var __CAIE_ENV: CareerAutomationRuntimeEnv | undefined;

  interface Window {
    __CAIE_ENV?: CareerAutomationRuntimeEnv;
  }
}

if (typeof globalThis !== 'undefined') {
  const globalEnv = globalThis.__CAIE_ENV || {};
  globalThis.__CAIE_ENV = {
    ...runtimeEnvSnapshot,
    ...globalEnv,
  };
}

if (typeof window !== 'undefined') {
  const existing = window.__CAIE_ENV || {};
  window.__CAIE_ENV = {
    ...runtimeEnvSnapshot,
    ...existing,
  };
}

export {};
