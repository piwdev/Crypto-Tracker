import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateVisiblePages } from '../../utils/pagination';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = React.memo(({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  maxVisiblePages = 7,
  className = ''
}) => {
  const { t } = useTranslation();
  const paginationRef = useRef<HTMLElement>(null);

  // Memoize total pages calculation
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  // Memoize navigation calculation
  const navigation = useMemo(() => calculateVisiblePages(currentPage, totalPages, {
    maxVisiblePages,
    boundaryCount: 1,
    siblingCount: 1,
    showEllipsis: true
  }), [currentPage, totalPages, maxVisiblePages]);

  const { visiblePages, canGoPrevious, canGoNext, showStartEllipsis, showEndEllipsis } = navigation;

  // Memoize event handlers to prevent unnecessary re-renders
  const handlePageClick = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePreviousClick = useCallback(() => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  }, [canGoPrevious, currentPage, onPageChange]);

  const handleNextClick = useCallback(() => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  }, [canGoNext, currentPage, onPageChange]);

  // Memoize keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (canGoPrevious) {
          onPageChange(currentPage - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (canGoNext) {
          onPageChange(currentPage + 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        if (currentPage !== 1) {
          onPageChange(1);
        }
        break;
      case 'End':
        event.preventDefault();
        if (currentPage !== totalPages) {
          onPageChange(totalPages);
        }
        break;
    }
  }, [canGoPrevious, canGoNext, currentPage, totalPages, onPageChange]);

  // Focus management for accessibility
  useEffect(() => {
    if (totalPages > 1 && paginationRef.current) {
      const currentPageButton = paginationRef.current.querySelector(
        '.pagination__button--current'
      ) as HTMLButtonElement;
      
      if (currentPageButton && document.activeElement?.closest('.pagination')) {
        currentPageButton.focus();
      }
    }
  }, [currentPage, totalPages]);

  // Don't render pagination if there's only one page or no items
  if (totalPages <= 1) {
    return null;
  }



  return (
    <nav 
      ref={paginationRef}
      className={`pagination ${className}`} 
      role="navigation" 
      aria-label={t('pagination.navigation')}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="pagination__container">
        {/* Previous button */}
        <button
          className={`pagination__button pagination__button--prev ${!canGoPrevious ? 'pagination__button--disabled' : ''}`}
          onClick={handlePreviousClick}
          disabled={!canGoPrevious}
          aria-label={t('pagination.previous')}
          type="button"
        >
          <span className="pagination__arrow">‹</span>
          <span className="pagination__text">{t('pagination.previous')}</span>
        </button>

        {/* Page numbers with ellipsis */}
        <div className="pagination__pages">
          {/* Start boundary page */}
          {showStartEllipsis && (
            <>
              <button
                className="pagination__button pagination__button--page"
                onClick={() => handlePageClick(1)}
                aria-label={t('pagination.goToPage', { page: 1 })}
                type="button"
              >
                1
              </button>
              <span className="pagination__ellipsis" aria-hidden="true">
                …
              </span>
            </>
          )}

          {/* Visible page numbers */}
          {visiblePages.map((page) => (
            <button
              key={page}
              className={`pagination__button pagination__button--page ${
                page === currentPage ? 'pagination__button--current' : ''
              }`}
              onClick={() => handlePageClick(page)}
              aria-label={
                page === currentPage 
                  ? t('pagination.currentPage', { page })
                  : t('pagination.goToPage', { page })
              }
              aria-current={page === currentPage ? 'page' : undefined}
              type="button"
            >
              {page}
            </button>
          ))}

          {/* End boundary page */}
          {showEndEllipsis && (
            <>
              <span className="pagination__ellipsis" aria-hidden="true">
                …
              </span>
              <button
                className="pagination__button pagination__button--page"
                onClick={() => handlePageClick(totalPages)}
                aria-label={t('pagination.goToPage', { page: totalPages })}
                type="button"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next button */}
        <button
          className={`pagination__button pagination__button--next ${!canGoNext ? 'pagination__button--disabled' : ''}`}
          onClick={handleNextClick}
          disabled={!canGoNext}
          aria-label={t('pagination.next')}
          type="button"
        >
          <span className="pagination__text">{t('pagination.next')}</span>
          <span className="pagination__arrow">›</span>
        </button>
      </div>

      {/* Page info */}
      <div className="pagination__info">
        {t('pagination.showing', {
          start: (currentPage - 1) * itemsPerPage + 1,
          end: Math.min(currentPage * itemsPerPage, totalItems),
          total: totalItems
        })}
      </div>

      {/* Keyboard navigation instructions */}
      <div className="pagination__instructions sr-only">
        {t('pagination.keyboardInstructions')}
      </div>
    </nav>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.totalItems === nextProps.totalItems &&
    prevProps.itemsPerPage === nextProps.itemsPerPage &&
    prevProps.maxVisiblePages === nextProps.maxVisiblePages &&
    prevProps.className === nextProps.className &&
    prevProps.onPageChange === nextProps.onPageChange
  );
});

// Set display name for debugging
Pagination.displayName = 'Pagination';

export default Pagination;