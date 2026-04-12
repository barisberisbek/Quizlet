import type { StorageService } from './index';

const STORAGE_PREFIX = 'dwp_';

/**
 * LocalStorageService — Browser localStorage implementation of StorageService.
 * 
 * All keys are prefixed with 'dwp_' to avoid collisions.
 * Data is JSON-serialized for storage.
 */
export class LocalStorageService implements StorageService {
  private prefix: string;

  constructor(prefix: string = STORAGE_PREFIX) {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[Storage] Failed to read key "${key}":`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] Failed to write key "${key}":`, error);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn(`[Storage] Failed to remove key "${key}":`, error);
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('[Storage] Failed to clear:', error);
    }
  }

  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }
}

// Singleton instance
export const storage = new LocalStorageService();
