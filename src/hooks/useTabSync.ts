import { useEffect, useCallback } from 'react';

interface UseTabSyncOptions {
  key: string;
  onUpdate?: (data: any) => void;
}

export const useTabSync = <T>(options: UseTabSyncOptions) => {
  const { key, onUpdate } = options;

  const updateData = useCallback((data: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // 다른 탭에 변경사항 알림
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(data),
        oldValue: localStorage.getItem(key),
        storageArea: localStorage,
      }));
    } catch (error) {
      console.error('Tab sync update failed:', error);
    }
  }, [key]);

  const getData = useCallback((): T | null => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Tab sync get data failed:', error);
      return null;
    }
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue && onUpdate) {
        try {
          const data = JSON.parse(event.newValue);
          onUpdate(data);
        } catch (error) {
          console.error('Tab sync parse failed:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, onUpdate]);

  return {
    updateData,
    getData,
  };
};
