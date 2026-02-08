
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    return entry?.resetTime || Date.now();
  }

  getTimeUntilReset(key: string): number {
    const resetTime = this.getResetTime(key);
    return Math.max(0, resetTime - Date.now());
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Global rate limiters for different operations
export const searchRateLimiter = new RateLimiter(20, 60000); // 20 searches per minute
export const apoRateLimiter = new RateLimiter(5, 60000); // 5 APO calculations per minute
export const exportRateLimiter = new RateLimiter(10, 300000); // 10 exports per 5 minutes

// Cleanup function to run periodically
setInterval(() => {
  searchRateLimiter.cleanup();
  apoRateLimiter.cleanup();
  exportRateLimiter.cleanup();
}, 300000); // Cleanup every 5 minutes

export function checkRateLimit(limiter: RateLimiter, userId: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  timeUntilReset: number;
} {
  const allowed = limiter.isAllowed(userId);
  const remaining = limiter.getRemainingRequests(userId);
  const resetTime = limiter.getResetTime(userId);
  const timeUntilReset = limiter.getTimeUntilReset(userId);

  return { allowed, remaining, resetTime, timeUntilReset };
}

export function formatTimeUntilReset(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}
