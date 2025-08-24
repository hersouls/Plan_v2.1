import { act, renderHook } from '@testing-library/react';
import { useFavoriteGroups } from '../useFavoriteGroups';

jest.mock('../../lib/utils', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const groups = [
  { id: 'b', name: 'Bravo' } as any,
  { id: 'a', name: 'Alpha' } as any,
  { id: 'c', name: 'Charlie' } as any,
];

describe('useFavoriteGroups', () => {
  beforeEach(() => {
    // Reset localStorage mock from setupTests
    localStorage.getItem = jest.fn().mockReturnValue(null);
    localStorage.setItem = jest.fn();
  });

  it('즐겨찾기 토글 및 지속화를 처리한다', () => {
    const { result } = renderHook(() => useFavoriteGroups(groups));

    expect(result.current.isFavorite('a')).toBe(false);

    act(() => result.current.toggleFavorite('a'));
    expect(result.current.isFavorite('a')).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalled();

    act(() => result.current.toggleFavorite('a'));
    expect(result.current.isFavorite('a')).toBe(false);
  });

  it('즐겨찾기가 먼저 정렬되고, 동순위는 이름순 정렬', () => {
    const { result } = renderHook(() => useFavoriteGroups(groups));

    // 초기: 즐겨찾기 없음 -> 이름순 Alpha, Bravo, Charlie
    expect(result.current.sortedGroups.map(g => g.name)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
    ]);

    act(() => result.current.toggleFavorite('c'));
    // c가 즐겨찾기 -> c, 그 다음 이름순 Alpha, Bravo
    expect(result.current.sortedGroups.map(g => g.id)).toEqual(['c', 'a', 'b']);
  });
});
