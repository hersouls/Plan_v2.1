import { useEffect, useState } from 'react';
import { enhancedUserService } from '../lib/firestore-improved';
import { User } from '../types/user';

interface UseUserOptions {
  userId?: string;
  autoLoad?: boolean;
}

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useUser(options: UseUserOptions = {}): UseUserReturn {
  const { userId, autoLoad = true } = options;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
    if (!userId) {
      setUser(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userProfile = await enhancedUserService.getUserProfile(userId);
      setUser(userProfile);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('사용자 프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && userId) {
      loadUser();
    }
  }, [userId, autoLoad]);

  const refetch = async () => {
    await loadUser();
  };

  const clearError = () => {
    setError(null);
  };

  return {
    user,
    loading,
    error,
    refetch,
    clearError,
  };
}

