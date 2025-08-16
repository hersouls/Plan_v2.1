import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}

export interface UsePaginationReturn<T> {
  // Current page info
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  
  // Navigation
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  
  // State checks
  canGoPrev: boolean;
  canGoNext: boolean;
  
  // Data slicing
  paginateData: <T>(data: T[]) => T[];
  
  // Page numbers for pagination UI
  pageNumbers: number[];
}

export function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1
}: UsePaginationOptions): UsePaginationReturn<any> {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate pagination values
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToFirst = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLast = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  // State checks
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Data slicing function
  const paginateData = useCallback(<T,>(data: T[]): T[] => {
    return data.slice(startIndex, endIndex);
  }, [startIndex, endIndex]);

  // Generate page numbers for pagination UI
  const pageNumbers = useMemo(() => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, -1); // -1 represents dots
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push(-1, totalPages); // -1 represents dots
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  // Reset to page 1 when totalItems changes significantly
  useState(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  });

  return {
    // Current page info
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    
    // Navigation
    goToPage,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    
    // State checks
    canGoPrev,
    canGoNext,
    
    // Data slicing
    paginateData,
    
    // Page numbers for pagination UI
    pageNumbers
  };
}

// Hook for infinite scroll pagination
export function useInfinitePagination<T>(
  fetchData: (page: number, limit: number) => Promise<{ data: T[], hasMore: boolean }>,
  itemsPerPage: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchData(currentPage, itemsPerPage);
      
      setData(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      console.error('Error loading more data:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [fetchData, currentPage, itemsPerPage, loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    reset();
    await loadMore();
  }, [reset, loadMore]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
    clearError: () => setError(null)
  };
}