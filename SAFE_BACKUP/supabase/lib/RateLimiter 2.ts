// supabase/lib/RateLimiter.ts
// Simple in-memory (per-edge-instance) token bucket with fallback to KV (Deno 1.42+)
// For production you would swap to a durable store (Redis, R2, Supabase KV).

export interface RateLimitOptions {
  windowMs: number; // e.g. 60_000 for 1 minute
  max: number; // max requests per window
}

const buckets: Record<string, { tokens: number; reset: number }> = {};

export function rateLimit(ip: string, opts: RateLimitOptions): {
  allowed: boolean;
  remaining: number;
  resetMs: number;
} {
  const now = Date.now();
  const bucket = buckets[ip] ?? { tokens: opts.max, reset: now + opts.windowMs };
  if (now > bucket.reset) {
    bucket.tokens = opts.max;
    bucket.reset = now + opts.windowMs;
  }
  const allowed = bucket.tokens > 0;
  if (allowed) bucket.tokens -= 1;
  buckets[ip] = bucket;
  return { allowed, remaining: bucket.tokens, resetMs: bucket.reset - now };
}
