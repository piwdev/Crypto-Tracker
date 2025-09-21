import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '../contexts/AuthContext';
import { bookmarkService } from './bookmarkService';
import BookmarkButton from '../components/crypto/BookmarkButton';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../../services/bookmarkService');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'crypto.bookmark': 'Bookmark',
        'crypto.removeBookmark': 'Remove Bookmark',
        'common.loading': 'Loading...',
        'errors.unauthorized': 'Unauthorized',
        'errors.serverError': 'Server Error',
        'errors.networkError': 'Network Error',
        'errors.unknownError': 'Unknown Error'
      };
      return translations[key] || key;
    }
  })
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockBookmarkService = bookmarkService as jest.Mocked<typeof bookmarkService>;

describe('BookmarkButton', () => {
  const mockCoinId = 'bitcoin';
  const mockOnBookmarkChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        clearError: jest.fn()
      });
    });

    it('should not render when user is not authenticated', () => {
      render(<BookmarkButton coinId={mockCoinId} />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, email: 'test@example.com', name: 'testuser', created_at: '', last_login_at: null },
        loading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        clearError: jest.fn()
      });
    });

    it('should render bookmark button when not bookmarked', async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(false);

      render(<BookmarkButton coinId={mockCoinId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Bookmark');
      expect(button).toHaveClass('bookmark-button--not-bookmarked');
    });

    it('should render remove bookmark button when bookmarked', async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(true);

      render(<BookmarkButton coinId={mockCoinId} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Remove Bookmark');
        expect(button).toHaveClass('bookmark-button--bookmarked');
      });
    });

    it('should add bookmark when clicking bookmark button', async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(false);
      mockBookmarkService.addBookmark.mockResolvedValue({
        data: { id: 1, user_id: 1, coin_id: mockCoinId, created_at: '' }
      });

      render(<BookmarkButton coinId={mockCoinId} onBookmarkChange={mockOnBookmarkChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockBookmarkService.addBookmark).toHaveBeenCalledWith(mockCoinId);
        expect(mockOnBookmarkChange).toHaveBeenCalledWith(true);
      });
    });

    it('should remove bookmark when clicking remove bookmark button', async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(true);
      mockBookmarkService.removeBookmark.mockResolvedValue();

      render(<BookmarkButton coinId={mockCoinId} onBookmarkChange={mockOnBookmarkChange} />);

      // Wait for the component to load and show the remove bookmark button
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Remove Bookmark');
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockBookmarkService.removeBookmark).toHaveBeenCalledWith(mockCoinId);
        expect(mockOnBookmarkChange).toHaveBeenCalledWith(false);
      });
    });

    it('should show loading state when processing', async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(false);
      mockBookmarkService.addBookmark.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<BookmarkButton coinId={mockCoinId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(button).toHaveTextContent('Loading...');
      expect(button).toBeDisabled();
    });

    it('should show error message when bookmark operation fails', async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(false);
      mockBookmarkService.addBookmark.mockRejectedValue({
        response: { status: 500 }
      });

      render(<BookmarkButton coinId={mockCoinId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Server Error');
      });
    });

    it('should handle network errors appropriately', async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(false);
      mockBookmarkService.addBookmark.mockRejectedValue({
        code: 'NETWORK_ERROR'
      });

      render(<BookmarkButton coinId={mockCoinId} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network Error');
      });
    });
  });
});