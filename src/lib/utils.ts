import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns the base URL for serverless functions.
// Priority:
// 1) Explicit env var VITE_FUNCTIONS_BASE
// 2) Default empty string -> same-origin (supabase functions proxied via /functions/v1)
export function getFunctionsBaseUrl(): string {
  const configured = import.meta?.env?.VITE_FUNCTIONS_BASE as string | undefined;
  if (configured && configured.length > 0) return configured;
  return '';
}
