import { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '../lib/utils';
import type { FamilyGroup } from '../types/group';

export interface UseFavoriteGroupsResult {
  favoriteGroupIds: string[];
  sortedGroups: FamilyGroup[];
  isFavorite: (groupId?: string | null) => boolean;
  toggleFavorite: (groupId: string) => void;
  setFavoriteGroupIds: (ids: string[]) => void;
}

export function useFavoriteGroups(
  groups: FamilyGroup[] = []
): UseFavoriteGroupsResult {
  const [favoriteGroupIds, setFavoriteGroupIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('favoriteGroups');
      if (saved) setFavoriteGroupIds(JSON.parse(saved));
    } catch (e) {
      logger.warn(
        'favorites',
        'Failed to load favorite groups from localStorage',
        e
      );
      setFavoriteGroupIds([]);
    }
  }, []);

  const persist = useCallback((ids: string[]) => {
    try {
      localStorage.setItem('favoriteGroups', JSON.stringify(ids));
    } catch (e) {
      logger.warn('favorites', 'Failed to persist favorite groups', e);
    }
  }, []);

  const setFavoriteGroupIdsSafe = useCallback(
    (ids: string[]) => {
      setFavoriteGroupIds(ids);
      persist(ids);
    },
    [persist]
  );

  const isFavorite = useCallback(
    (groupId?: string | null) => {
      if (!groupId) return false;
      return favoriteGroupIds.includes(groupId);
    },
    [favoriteGroupIds]
  );

  const toggleFavorite = useCallback(
    (groupId: string) => {
      const next = favoriteGroupIds.includes(groupId)
        ? favoriteGroupIds.filter((id: string) => id !== groupId)
        : [...favoriteGroupIds, groupId];
      setFavoriteGroupIdsSafe(next);
    },
    [favoriteGroupIds, setFavoriteGroupIdsSafe]
  );

  const sortedGroups = useMemo(() => {
    if (!groups?.length) return [];
    return [...groups].sort((a, b) => {
      const aFav = favoriteGroupIds.includes(a.id);
      const bFav = favoriteGroupIds.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [groups, favoriteGroupIds]);

  return {
    favoriteGroupIds,
    sortedGroups,
    isFavorite,
    toggleFavorite,
    setFavoriteGroupIds: setFavoriteGroupIdsSafe,
  };
}
