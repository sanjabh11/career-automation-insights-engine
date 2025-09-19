import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns the base URL for serverless functions.
// Priority:
// 1) Explicit env var VITE_FUNCTIONS_BASE
// 2) Netlify Dev convention (frontend on 8080, functions on 8888)
// 3) Default empty string -> same-origin
export function getFunctionsBaseUrl(): string {
  const configured = import.meta?.env?.VITE_FUNCTIONS_BASE as string | undefined;
  if (configured && configured.length > 0) return configured;
  if (typeof window !== 'undefined' && window.location?.port === '8080') {
    return 'http://localhost:8888';
  }
  return '';
}
