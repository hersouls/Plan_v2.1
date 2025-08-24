import { useCallback, useEffect, useState } from 'react';
import logger from '../lib/logger';

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
) {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : defaultValue;
    } catch (error) {
      logger.warn('useLocalStorage', `read key ${key} failed`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setState(prev => {
          const valueToStore =
            value instanceof Function ? (value as (p: T) => T)(prev) : value;
          window.localStorage.setItem(key, serialize(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        logger.warn('useLocalStorage', `set key ${key} failed`, error);
      }
    },
    [key, serialize]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setState(defaultValue);
    } catch (error) {
      logger.warn('useLocalStorage', `remove key ${key} failed`, error);
    }
  }, [key, defaultValue]);

  // Listen for changes to this key in other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setState(deserialize(e.newValue));
        } catch (error) {
          logger.warn(
            'useLocalStorage',
            `parse key ${key} from event failed`,
            error
          );
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize]);

  return [state, setValue, removeValue] as const;
}
