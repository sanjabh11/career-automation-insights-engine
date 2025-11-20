
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items to cache
  serialize?: boolean; // Whether to serialize complex objects
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

class AdvancedCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize = 100, defaultTtl = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTtl;
    const now = Date.now();

    // Clean up expired items before adding new ones
    this.cleanup();

    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data: options.serialize ? JSON.parse(JSON.stringify(data)) : data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccess: now
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;

    const now = Date.now();
    
    // Check if item has expired
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccess = now;

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccess < oldestAccess) {
        oldestAccess = item.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
      totalAccesses: Array.from(this.cache.values()).reduce((sum, item) => sum + item.accessCount, 0)
    };
  }
}

// Global cache instance
const globalCache = new AdvancedCache();

export function useAdvancedCaching() {
  const queryClient = useQueryClient();
  
  const [cacheStats, setCacheStats] = useState(globalCache.getStats());

  const updateStats = useCallback(() => {
    setCacheStats(globalCache.getStats());
  }, []);

  useEffect(() => {
    // Update stats periodically
    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, [updateStats]);

  const setCache = useCallback(<T>(key: string, data: T, options?: CacheOptions) => {
    globalCache.set(key, data, options);
    updateStats();
  }, [updateStats]);

  const getCache = useCallback(<T>(key: string): T | null => {
    const result = globalCache.get<T>(key);
    updateStats();
    return result;
  }, [updateStats]);

  const hasCache = useCallback((key: string): boolean => {
    return globalCache.has(key);
  }, []);

  const deleteCache = useCallback((key: string): boolean => {
    const result = globalCache.delete(key);
    updateStats();
    return result;
  }, [updateStats]);

  const clearCache = useCallback(() => {
    globalCache.clear();
    queryClient.clear(); // Also clear React Query cache
    updateStats();
  }, [queryClient, updateStats]);

  const invalidatePattern = useCallback((pattern: string) => {
    const regex = new RegExp(pattern);
    const keys = Array.from(globalCache.getStats().keys);
    
    keys.forEach(key => {
      if (regex.test(key)) {
        globalCache.delete(key);
      }
    });
    
    // Also invalidate matching React Query keys
    queryClient.invalidateQueries({
      predicate: (query) => regex.test(query.queryKey.join('-'))
    });
    
    updateStats();
  }, [queryClient, updateStats]);

  return {
    setCache,
    getCache,
    hasCache,
    deleteCache,
    clearCache,
    invalidatePattern,
    cacheStats
  };
}
