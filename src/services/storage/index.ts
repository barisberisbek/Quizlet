/**
 * StorageService — Abstract interface for data persistence.
 * 
 * Version 1 uses localStorage (see ./localStorage.ts).
 * 
 * Future migration path:
 * - Create a FirebaseStorageService that implements this interface
 * - Swap the implementation in the service factory
 * - Firebase Auth would handle user identity
 * - Firestore would replace localStorage for cross-device sync
 * - This interface remains unchanged
 */
export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}
