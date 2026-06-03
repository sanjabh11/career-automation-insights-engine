
export interface APIError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getNestedRecord = (value: unknown, key: string): Record<string, unknown> | null => {
  if (!isRecord(value)) return null;
  const child = value[key];
  return isRecord(child) ? child : null;
};

const getString = (value: unknown, key: string): string | undefined => {
  if (!isRecord(value)) return undefined;
  const child = value[key];
  return typeof child === 'string' ? child : undefined;
};

const getNumber = (value: unknown, key: string): number | undefined => {
  if (!isRecord(value)) return undefined;
  const child = value[key];
  return typeof child === 'number' ? child : undefined;
};

export class APIErrorHandler {
  static handle(error: unknown): APIError {
    const timestamp = new Date().toISOString();
    const supabaseError = getNestedRecord(error, 'error');
    const supabaseMessage = getString(supabaseError, 'message');
    const supabaseCode = getString(supabaseError, 'code');
    const status = getNumber(error, 'status');
    const message = getString(error, 'message');
    
    // Supabase errors
    if (supabaseMessage) {
      return {
        code: supabaseCode || 'SUPABASE_ERROR',
        message: supabaseMessage,
        details: supabaseError,
        timestamp
      };
    }

    // Network errors
    if (!navigator.onLine) {
      return {
        code: 'NETWORK_ERROR',
        message: 'No internet connection. Please check your network and try again.',
        timestamp
      };
    }

    // Rate limit errors
    if (status === 429) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait a moment before trying again.',
        timestamp
      };
    }

    // Authentication errors
    if (status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Please sign in to continue.',
        timestamp
      };
    }

    // Server errors
    if (typeof status === 'number' && status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server temporarily unavailable. Please try again later.',
        timestamp
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: message || 'An unexpected error occurred. Please try again.',
      details: error,
      timestamp
    };
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, attempt), 16000);
  }

  static shouldRetry(error: APIError, attempt: number): boolean {
    if (attempt >= 3) return false;
    
    // Don't retry client errors (4xx)
    if (['UNAUTHORIZED', 'RATE_LIMIT_EXCEEDED'].includes(error.code)) {
      return false;
    }

    // Retry server errors and network errors
    return ['SERVER_ERROR', 'NETWORK_ERROR', 'UNKNOWN_ERROR'].includes(error.code);
  }

  static logError(error: APIError, context?: string): void {
    console.error(`[API Error${context ? ` - ${context}` : ''}]:`, {
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      details: error.details
    });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  context?: string,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: APIError;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = APIErrorHandler.handle(error);
      APIErrorHandler.logError(lastError, context);
      
      if (!APIErrorHandler.shouldRetry(lastError, attempt)) {
        throw lastError;
      }
      
      if (attempt < maxAttempts - 1) {
        const delay = APIErrorHandler.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
