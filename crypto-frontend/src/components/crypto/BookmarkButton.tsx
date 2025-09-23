import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { bookmarkService } from '../../services/bookmarkService';
import './BookmarkButton.css';
import BookmarkIconTrue from '../../statics/bookmark-true.svg';
import BookmartIconFalse from '../../statics/bookmark-false.svg';

interface BookmarkButtonProps {
  coinId: string;
  className?: string;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = React.memo(({ 
  coinId, 
  className = '',
  onBookmarkChange 
}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if coin is bookmarked
  const checkBookmarkStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsBookmarked(false);
      return;
    }

    try {
      const isCurrentCoinBookmarked = await bookmarkService.isBookmarked(coinId);
      setIsBookmarked(isCurrentCoinBookmarked);
    } catch (err: any) {
      console.error('Error checking bookmark status:', err);
      // Don't show error for bookmark status check, just assume not bookmarked
      setIsBookmarked(false);
    }
  }, [coinId, isAuthenticated]);

  // Initialize bookmark status
  useEffect(() => {
    checkBookmarkStatus();
  }, [checkBookmarkStatus]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isBookmarked) {
        await bookmarkService.removeBookmark(coinId);
        setIsBookmarked(false);
        onBookmarkChange?.(false);
      } else {
        await bookmarkService.addBookmark(coinId);
        setIsBookmarked(true);
        onBookmarkChange?.(true);
      }
    } catch (err: any) {
      console.error('Error toggling bookmark:', err);
      
      // Set appropriate error message
      if (err.response?.status === 401) {
        setError(t('errors.unauthorized'));
      } else if (err.response?.status >= 500) {
        setError(t('errors.serverError'));
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError(t('errors.networkError'));
      } else {
        setError(t('errors.unknownError'));
      }
      
      // Revert the optimistic update by rechecking status
      setTimeout(() => {
        checkBookmarkStatus();
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const buttonText = useMemo(() => 
    isBookmarked ? t('crypto.removeBookmark') : t('crypto.bookmark'), 
    [isBookmarked, t]
  );
  
  const buttonClass = useMemo(() => 
    `bookmark-button ${isBookmarked ? 'bookmark-button--bookmarked' : 'bookmark-button--not-bookmarked'} ${className}`,
    [isBookmarked, className]
  );

  // Don't render if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bookmark-button-container">
      <button
        className={buttonClass}
        onClick={handleBookmarkToggle}
        disabled={loading}
        aria-label={buttonText}
        title={buttonText}
      >
        <span className="bookmark-button__icon">
          {isBookmarked ? <img src={BookmarkIconTrue} width={30} height={30} /> : <img src={BookmartIconFalse} width={30} height={30} />}
        </span>
      </button>
      
      {error && (
        <div className="bookmark-button__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
});

export default BookmarkButton;