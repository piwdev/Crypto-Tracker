/**
 * Pagination utility functions for calculating page ranges and navigation
 */

import { PaginationState, PageNavigation, PaginationConfig, PaginationCalculation } from '../types/pagination';

// Memoization cache for pagination calculations
const paginationCache = new Map<string, any>();

/**
 * Create a cache key for memoization
 */
const createCacheKey = (prefix: string, ...args: any[]): string => {
  return `${prefix}:${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(':')}`;
};

/**
 * Memoized function wrapper
 */
const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  keyPrefix: string
): T => {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = createCacheKey(keyPrefix, ...args);
    
    if (paginationCache.has(key)) {
      return paginationCache.get(key);
    }
    
    const result = fn(...args);
    paginationCache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (paginationCache.size > 1000) {
      const firstKey = paginationCache.keys().next().value;
      if (firstKey !== undefined) {
        paginationCache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
};

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  maxVisiblePages: 7,
  showEllipsis: true,
  boundaryCount: 1,
  siblingCount: 1,
};

/**
 * Calculate pagination state from basic parameters (internal implementation)
 */
const _calculatePaginationState = (
  currentPage: number,
  totalItems: number,
  itemsPerPage: number
): PaginationState => {
  // Handle edge cases for totalItems
  const safeTotalItems = Math.max(0, totalItems);
  const totalPages = itemsPerPage > 0 ? Math.ceil(safeTotalItems / itemsPerPage) : 0;
  
  // Ensure currentPage is within valid bounds
  const validCurrentPage = totalPages > 0 ? Math.max(1, Math.min(currentPage, totalPages)) : 1;
  
  return {
    currentPage: validCurrentPage,
    itemsPerPage,
    totalItems: safeTotalItems,
    totalPages,
  };
};

/**
 * Calculate pagination state from basic parameters (memoized)
 */
export const calculatePaginationState = memoize(_calculatePaginationState, 'paginationState');

/**
 * Calculate visible page numbers with ellipsis logic (internal implementation)
 */
const _calculateVisiblePages = (
  currentPage: number,
  totalPages: number,
  config: Partial<PaginationConfig> = {}
): PageNavigation => {
  const { maxVisiblePages, boundaryCount, siblingCount } = {
    ...DEFAULT_PAGINATION_CONFIG,
    ...config,
  };

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // If total pages fit within maxVisiblePages, show all
  if (totalPages <= maxVisiblePages) {
    return {
      canGoPrevious,
      canGoNext,
      visiblePages: Array.from({ length: totalPages }, (_, i) => i + 1),
      showStartEllipsis: false,
      showEndEllipsis: false,
    };
  }

  // Calculate the range around current page
  const startPages = Array.from({ length: boundaryCount }, (_, i) => i + 1);
  const endPages = Array.from(
    { length: boundaryCount },
    (_, i) => totalPages - boundaryCount + i + 1
  );

  const siblingStart = Math.max(currentPage - siblingCount, 1);
  const siblingEnd = Math.min(currentPage + siblingCount, totalPages);
  
  const siblingPages = Array.from(
    { length: siblingEnd - siblingStart + 1 },
    (_, i) => siblingStart + i
  );

  // Determine if we need ellipsis
  const showStartEllipsis = siblingStart > boundaryCount + 2;
  const showEndEllipsis = siblingEnd < totalPages - boundaryCount - 1;

  // Build visible pages - only include sibling pages, not boundary pages when ellipsis is shown
  let visiblePages: number[] = [];
  
  if (showStartEllipsis && showEndEllipsis) {
    // Show only siblings around current page
    visiblePages = siblingPages;
  } else if (showStartEllipsis) {
    // Show siblings + end boundary
    visiblePages = [...siblingPages, ...endPages];
  } else if (showEndEllipsis) {
    // Show start boundary + siblings
    visiblePages = [...startPages, ...siblingPages];
  } else {
    // No ellipsis needed, show all
    visiblePages = [...startPages, ...siblingPages, ...endPages];
  }

  // Remove duplicates and sort
  const uniquePages = visiblePages.filter((page, index) => visiblePages.indexOf(page) === index);
  visiblePages = uniquePages.sort((a, b) => a - b);

  return {
    canGoPrevious,
    canGoNext,
    visiblePages,
    showStartEllipsis,
    showEndEllipsis,
  };
};

/**
 * Calculate visible page numbers with ellipsis logic (memoized)
 */
export const calculateVisiblePages = memoize(_calculateVisiblePages, 'visiblePages');

/**
 * Calculate data slice indices for current page (internal implementation)
 */
const _calculatePageIndices = (
  currentPage: number,
  itemsPerPage: number
): { startIndex: number; endIndex: number } => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  return { startIndex, endIndex };
};

/**
 * Calculate data slice indices for current page (memoized)
 */
export const calculatePageIndices = memoize(_calculatePageIndices, 'pageIndices');

/**
 * Complete pagination calculation combining all utilities (internal implementation)
 */
const _calculatePagination = (
  currentPage: number,
  totalItems: number,
  itemsPerPage: number,
  config: Partial<PaginationConfig> = {}
): PaginationCalculation => {
  const state = calculatePaginationState(currentPage, totalItems, itemsPerPage);
  const navigation = calculateVisiblePages(state.currentPage, state.totalPages, config);
  const { startIndex, endIndex } = calculatePageIndices(state.currentPage, itemsPerPage);

  return {
    state,
    navigation,
    startIndex,
    endIndex,
  };
};

/**
 * Complete pagination calculation combining all utilities (memoized)
 */
export const calculatePagination = memoize(_calculatePagination, 'pagination');

/**
 * Validate page number is within bounds
 */
export const isValidPage = (page: number, totalPages: number): boolean => {
  return page >= 1 && page <= totalPages && Number.isInteger(page);
};

/**
 * Get safe page number within bounds
 */
export const getSafePage = (page: number, totalPages: number): number => {
  if (totalPages <= 0) {
    return totalPages;
  }
  return Math.max(1, Math.min(page, totalPages));
};

/**
 * Calculate page range for display (e.g., "Showing 1-20 of 100 items") (internal implementation)
 */
const _calculateDisplayRange = (
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
): { start: number; end: number; total: number } => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const start = Math.min(startIndex + 1, totalItems);
  const end = Math.min(startIndex + itemsPerPage, totalItems);
  
  return { start, end, total: totalItems };
};

/**
 * Calculate page range for display (e.g., "Showing 1-20 of 100 items") (memoized)
 */
export const calculateDisplayRange = memoize(_calculateDisplayRange, 'displayRange');

/**
 * Clear pagination cache (useful for testing or memory management)
 */
export const clearPaginationCache = (): void => {
  paginationCache.clear();
};