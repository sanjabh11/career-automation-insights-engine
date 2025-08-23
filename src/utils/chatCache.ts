/**
 * chatCache.ts
 * A lightweight localStorage helper for persisting conversation history between
 * the user and the AI Career Coach. Each user gets a separate cache key.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const CACHE_PREFIX = 'career-coach-chat-';

export function loadChatHistory(userId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + userId);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export function saveChatHistory(userId: string, history: ChatMessage[]) {
  try {
    localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(history));
  } catch {
    /* storage quota exceeded or unavailable */
  }
}
