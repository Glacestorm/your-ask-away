/**
 * KB 4.5 - Pagination & Infinite Scroll
 * Fase 14 - Paginación cursor/offset con hooks
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBPaginationConfig {
  initialPage?: number;
  pageSize?: number;
  totalItems?: number;
}

export interface KBPaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export interface KBPaginationActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;
}

export interface KBCursorPaginationConfig<TCursor = string> {
  initialCursor?: TCursor | null;
  pageSize?: number;
}

export interface KBCursorPaginationState<TCursor = string> {
  cursor: TCursor | null;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  cursors: TCursor[];
  currentIndex: number;
}

export interface KBInfiniteScrollConfig<T, TCursor = string> {
  fetchFn: (cursor: TCursor | null, pageSize: number) => Promise<{
    data: T[];
    nextCursor: TCursor | null;
    hasMore: boolean;
  }>;
  pageSize?: number;
  threshold?: number;
  initialData?: T[];
  enabled?: boolean;
}

export interface KBInfiniteScrollState<T> {
  data: T[];
  isLoading: boolean;
  isFetchingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  isEmpty: boolean;
}

export interface KBVirtualListConfig {
  itemCount: number;
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
}

export interface KBVirtualListState {
  startIndex: number;
  endIndex: number;
  visibleItems: number[];
  totalHeight: number;
  offsetY: number;
}

// ============================================================================
// OFFSET PAGINATION HOOK
// ============================================================================

/**
 * Hook para paginación basada en offset/page
 */
export function useKBPagination(
  config: KBPaginationConfig = {}
): [KBPaginationState, KBPaginationActions] {
  const {
    initialPage = 1,
    pageSize: initialPageSize = 10,
    totalItems: initialTotalItems = 0,
  } = config;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalItems, setTotalItemsState] = useState(initialTotalItems);

  const state = useMemo<KBPaginationState>(() => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage >= totalPages,
    };
  }, [currentPage, pageSize, totalItems]);

  const goToPage = useCallback((page: number) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalItems, pageSize]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    goToPage(totalPages);
  }, [totalItems, pageSize, goToPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    // Reset to first page when page size changes
    setCurrentPage(1);
  }, []);

  const setTotalItems = useCallback((total: number) => {
    setTotalItemsState(total);
  }, []);

  const actions: KBPaginationActions = {
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
    setTotalItems,
  };

  return [state, actions];
}

// ============================================================================
// CURSOR PAGINATION HOOK
// ============================================================================

/**
 * Hook para paginación basada en cursor
 */
export function useKBCursorPagination<TCursor = string>(
  config: KBCursorPaginationConfig<TCursor> = {}
): {
  state: KBCursorPaginationState<TCursor>;
  goToNext: (nextCursor: TCursor) => void;
  goToPrevious: () => void;
  reset: () => void;
  setHasNextPage: (hasNext: boolean) => void;
} {
  const { initialCursor = null, pageSize = 10 } = config;

  const [cursor, setCursor] = useState<TCursor | null>(initialCursor);
  const [cursors, setCursors] = useState<TCursor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const state = useMemo<KBCursorPaginationState<TCursor>>(() => ({
    cursor,
    pageSize,
    hasNextPage,
    hasPreviousPage: currentIndex > 0,
    cursors,
    currentIndex,
  }), [cursor, pageSize, hasNextPage, cursors, currentIndex]);

  const goToNext = useCallback((nextCursor: TCursor) => {
    if (cursor !== null) {
      setCursors(prev => [...prev.slice(0, currentIndex + 1), cursor]);
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setCursor(nextCursor);
  }, [cursor, currentIndex]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevCursor = cursors[currentIndex - 1];
      setCursor(prevCursor);
      setCurrentIndex(prev => prev - 1);
      setHasNextPage(true);
    } else if (currentIndex === 0) {
      setCursor(null);
      setCurrentIndex(-1);
      setHasNextPage(true);
    }
  }, [currentIndex, cursors]);

  const reset = useCallback(() => {
    setCursor(initialCursor);
    setCursors([]);
    setCurrentIndex(-1);
    setHasNextPage(true);
  }, [initialCursor]);

  return {
    state,
    goToNext,
    goToPrevious,
    reset,
    setHasNextPage,
  };
}

// ============================================================================
// INFINITE SCROLL HOOK
// ============================================================================

/**
 * Hook para infinite scroll con carga automática
 */
export function useKBInfiniteScroll<T, TCursor = string>(
  config: KBInfiniteScrollConfig<T, TCursor>
): KBInfiniteScrollState<T> & {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
} {
  const {
    fetchFn,
    pageSize = 20,
    threshold = 0.8,
    initialData = [],
    enabled = true,
  } = config;

  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<TCursor | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLElement | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || !enabled) return;

    loadingRef.current = true;
    const isInitialLoad = data.length === 0;
    
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    setError(null);

    try {
      const result = await fetchFn(cursor, pageSize);
      
      setData(prev => isInitialLoad ? result.data : [...prev, ...result.data]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      loadingRef.current = false;
    }
  }, [cursor, hasMore, enabled, fetchFn, pageSize, data.length]);

  const refresh = useCallback(async () => {
    setCursor(null);
    setData([]);
    setHasMore(true);
    setError(null);
    
    loadingRef.current = false;
    
    // Trigger initial load
    setTimeout(() => loadMore(), 0);
  }, [loadMore]);

  const reset = useCallback(() => {
    setCursor(null);
    setData(initialData);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    setIsFetchingMore(false);
    loadingRef.current = false;
  }, [initialData]);

  // Set up intersection observer
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node && enabled) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
            loadMore();
          }
        },
        { threshold }
      );

      observerRef.current.observe(node);
      sentinelNodeRef.current = node;
    }
  }, [enabled, hasMore, loadMore, threshold]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0 && !isLoading) {
      loadMore();
    }
  }, [enabled]);

  return {
    data,
    isLoading,
    isFetchingMore,
    error,
    hasMore,
    isEmpty: !isLoading && data.length === 0,
    loadMore,
    refresh,
    reset,
    sentinelRef,
  };
}

// ============================================================================
// VIRTUAL LIST HOOK
// ============================================================================

/**
 * Hook para virtualización de listas largas
 */
export function useKBVirtualList(
  config: KBVirtualListConfig
): KBVirtualListState & {
  containerRef: (node: HTMLElement | null) => void;
  onScroll: (scrollTop: number) => void;
  getItemStyle: (index: number) => React.CSSProperties;
} {
  const { itemCount, itemHeight, containerHeight, overscan = 3 } = config;

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions: number[] = [];
    let currentPosition = 0;

    for (let i = 0; i < itemCount; i++) {
      positions.push(currentPosition);
      currentPosition += typeof itemHeight === 'function' ? itemHeight(i) : itemHeight;
    }

    return positions;
  }, [itemCount, itemHeight]);

  const totalHeight = useMemo(() => {
    if (itemCount === 0) return 0;
    const lastPosition = itemPositions[itemCount - 1];
    const lastHeight = typeof itemHeight === 'function' ? itemHeight(itemCount - 1) : itemHeight;
    return lastPosition + lastHeight;
  }, [itemPositions, itemCount, itemHeight]);

  // Find visible range using binary search
  const visibleRange = useMemo(() => {
    if (itemCount === 0) return { start: 0, end: 0 };

    // Binary search for start index
    let start = 0;
    let end = itemCount - 1;
    
    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      const midHeight = typeof itemHeight === 'function' ? itemHeight(mid) : itemHeight;
      
      if (itemPositions[mid] + midHeight < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    const startIndex = Math.max(0, start - overscan);

    // Find end index
    let endIndex = startIndex;
    while (endIndex < itemCount && itemPositions[endIndex] < scrollTop + containerHeight) {
      endIndex++;
    }
    endIndex = Math.min(itemCount - 1, endIndex + overscan);

    return { start: startIndex, end: endIndex };
  }, [scrollTop, containerHeight, itemPositions, itemCount, itemHeight, overscan]);

  const visibleItems = useMemo(() => {
    const items: number[] = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push(i);
    }
    return items;
  }, [visibleRange]);

  const state: KBVirtualListState = {
    startIndex: visibleRange.start,
    endIndex: visibleRange.end,
    visibleItems,
    totalHeight,
    offsetY: itemPositions[visibleRange.start] || 0,
  };

  const handleContainerRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
  }, []);

  const onScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);

  const getItemStyle = useCallback((index: number): React.CSSProperties => {
    const height = typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    return {
      position: 'absolute',
      top: itemPositions[index],
      left: 0,
      right: 0,
      height,
    };
  }, [itemPositions, itemHeight]);

  return {
    ...state,
    containerRef: handleContainerRef,
    onScroll,
    getItemStyle,
  };
}

// ============================================================================
// KEYSET PAGINATION HOOK
// ============================================================================

export interface KBKeysetPaginationConfig<T> {
  keyField: keyof T;
  pageSize?: number;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Hook para paginación keyset (más eficiente que offset para grandes datasets)
 */
export function useKBKeysetPagination<T>(
  config: KBKeysetPaginationConfig<T>
): {
  lastKey: T[keyof T] | null;
  firstKey: T[keyof T] | null;
  pageSize: number;
  updateKeys: (items: T[]) => void;
  reset: () => void;
  getNextPageParams: () => { after: T[keyof T] | null; limit: number };
  getPreviousPageParams: () => { before: T[keyof T] | null; limit: number };
} {
  const { keyField, pageSize = 20, sortDirection = 'asc' } = config;

  const [lastKey, setLastKey] = useState<T[keyof T] | null>(null);
  const [firstKey, setFirstKey] = useState<T[keyof T] | null>(null);
  const [keyHistory, setKeyHistory] = useState<Array<{ first: T[keyof T]; last: T[keyof T] }>>([]);

  const updateKeys = useCallback((items: T[]) => {
    if (items.length === 0) return;

    const first = items[0][keyField];
    const last = items[items.length - 1][keyField];

    if (firstKey !== null && lastKey !== null) {
      setKeyHistory(prev => [...prev, { first: firstKey, last: lastKey }]);
    }

    setFirstKey(first);
    setLastKey(last);
  }, [keyField, firstKey, lastKey]);

  const reset = useCallback(() => {
    setLastKey(null);
    setFirstKey(null);
    setKeyHistory([]);
  }, []);

  const getNextPageParams = useCallback(() => ({
    after: sortDirection === 'asc' ? lastKey : firstKey,
    limit: pageSize,
  }), [lastKey, firstKey, pageSize, sortDirection]);

  const getPreviousPageParams = useCallback(() => ({
    before: sortDirection === 'asc' ? firstKey : lastKey,
    limit: pageSize,
  }), [firstKey, lastKey, pageSize, sortDirection]);

  return {
    lastKey,
    firstKey,
    pageSize,
    updateKeys,
    reset,
    getNextPageParams,
    getPreviousPageParams,
  };
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Genera array de números de página para UI
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const sidePages = Math.floor((maxVisible - 3) / 2);

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  let start = Math.max(2, currentPage - sidePages);
  let end = Math.min(totalPages - 1, currentPage + sidePages);

  // Adjust if near start or end
  if (currentPage <= sidePages + 2) {
    end = Math.min(totalPages - 1, maxVisible - 2);
  } else if (currentPage >= totalPages - sidePages - 1) {
    start = Math.max(2, totalPages - maxVisible + 3);
  }

  // Add ellipsis before range if needed
  if (start > 2) {
    pages.push('ellipsis');
  }

  // Add range
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis after range if needed
  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

/**
 * Calcula el rango de items visibles
 */
export function calculateItemRange(
  currentPage: number,
  pageSize: number,
  totalItems: number
): { start: number; end: number; showing: string } {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  
  return {
    start,
    end,
    showing: `${start}-${end} of ${totalItems}`,
  };
}

export default useKBPagination;
