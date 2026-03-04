import { useState, useCallback } from "react";

/**
 * Custom hook for syncing state with localStorage
 * @param key - localStorage key
 * @param initialValue - default value if key doesn't exist
 * @returns [value, setValue] - like useState but persisted to localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: Error reading ${key} from localStorage`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
    } catch (error) {
      console.warn(`useLocalStorage: Error writing ${key} to localStorage`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Clear all app data from localStorage
 */
export function clearAppLocalStorage() {
  const keysToKeep = ["auth"]; // keep auth tokens
  const keysToDelete = Object.keys(localStorage).filter(k => !keysToKeep.some(keep => k.includes(keep)));
  keysToDelete.forEach(k => localStorage.removeItem(k));
}
