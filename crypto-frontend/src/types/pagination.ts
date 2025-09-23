/**
 * Pagination-related TypeScript interfaces and types
 */

/**
 * Core pagination state interface
 */
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Page navigation metadata interface
 */
export interface PageNavigation {
  canGoPrevious: boolean;
  canGoNext: boolean;
  visiblePages: number[];
  showStartEllipsis: boolean;
  showEndEllipsis: boolean;
}

/**
 * Props interface for Pagination component
 */
export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  className?: string;
}

/**
 * Configuration options for pagination calculations
 */
export interface PaginationConfig {
  maxVisiblePages: number;
  showEllipsis: boolean;
  boundaryCount: number; // Number of pages to show at start/end
  siblingCount: number;  // Number of pages to show around current page
}

/**
 * Result of pagination calculations
 */
export interface PaginationCalculation {
  state: PaginationState;
  navigation: PageNavigation;
  startIndex: number;
  endIndex: number;
}