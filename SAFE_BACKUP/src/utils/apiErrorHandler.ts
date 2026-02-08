
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class APIErrorHandler {
  static handle(error: any): APIError {
    const timestamp = new Date().toISOString();
    
    // Supabase errors
    if (error?.error?.message) {
      return {
        code: error.error.code || 'SUPABASE_ERROR',
        message: error.error.message,
        details: error.error,
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
    if (error?.status === 429) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait a moment before trying again.',
        timestamp
      };
    }

    // Authentication errors
    if (error?.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Please sign in to continue.',
        timestamp
      };
    }

    // Server errors
    if (error?.status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server temporarily unavailable. Please try again later.',
        timestamp
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unexpected error occurred. Please try again.',
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
