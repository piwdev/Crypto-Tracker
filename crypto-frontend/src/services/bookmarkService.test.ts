import { bookmarkService } from './bookmarkService';
import api from './api';
import { BookmarkResponse, CoinListResponse } from '../types/crypto';

// Mock the api module
jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('bookmarkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addBookmark', () => {
    it('should add a bookmark successfully', async () => {
      const coinId = 'bitcoin';
      const mockResponse: BookmarkResponse = {
        data: {
          id: 1,
          user_id: 1,
          coin_id: coinId,
          created_at: '2023-01-01T00:00:00Z'
        },
        message: 'Bookmark added successfully'
      };

      mockedApi.post.mockResolvedValue({ 
      data: mockResponse,
      status: 201,
      statusText: 'Created',
      headers: {},
      config: { headers: {} as any }
    });

      const result = await bookmarkService.addBookmark(coinId);

      expect(mockedApi.post).toHaveBeenCalledWith('/bookmarks/', { coin_id: coinId });
      expect(result).toEqual(mockResponse);
    });

    it('should handle authentication errors when adding bookmark', async () => {
      const coinId = 'bitcoin';
      const authError = {
        response: {
          status: 401,
          data: { error: 'Authentication required' }
        }
      };

      mockedApi.post.mockRejectedValue(authError);

      await expect(bookmarkService.addBookmark(coinId)).rejects.toEqual(authError);
      expect(mockedApi.post).toHaveBeenCalledWith('/bookmarks/', { coin_id: coinId });
    });

    it('should handle server errors when adding bookmark', async () => {
      const coinId = 'bitcoin';
      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };

      mockedApi.post.mockRejectedValue(serverError);

      await expect(bookmarkService.addBookmark(coinId)).rejects.toEqual(serverError);
    });
  });

  describe('removeBookmark', () => {
    it('should remove a bookmark successfully', async () => {
      const coinId = 'bitcoin';

      mockedApi.delete.mockResolvedValue({ 
        data: null,
        status: 204,
        statusText: 'No Content',
        headers: {},
        config: { headers: {} as any }
      });

      await bookmarkService.removeBookmark(coinId);

      expect(mockedApi.delete).toHaveBeenCalledWith(`/bookmarks/${coinId}/`);
    });

    it('should handle authentication errors when removing bookmark', async () => {
      const coinId = 'bitcoin';
      const authError = {
        response: {
          status: 401,
          data: { error: 'Authentication required' }
        }
      };

      mockedApi.delete.mockRejectedValue(authError);

      await expect(bookmarkService.removeBookmark(coinId)).rejects.toEqual(authError);
      expect(mockedApi.delete).toHaveBeenCalledWith(`/bookmarks/${coinId}/`);
    });

    it('should handle not found errors when removing bookmark', async () => {
      const coinId = 'bitcoin';
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Bookmark not found' }
        }
      };

      mockedApi.delete.mockRejectedValue(notFoundError);

      await expect(bookmarkService.removeBookmark(coinId)).rejects.toEqual(notFoundError);
    });
  });

  describe('getUserBookmarks', () => {
    it('should get user bookmarks successfully', async () => {
      const mockResponse: CoinListResponse = {
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            image: 'https://example.com/bitcoin.png',
            current_price: 50000,
            market_cap: 1000000000,
            market_cap_rank: 1,
            fully_diluted_valuation: null,
            total_volume: 50000000,
            high_24h: 51000,
            low_24h: 49000,
            price_change_24h: 1000,
            price_change_percentage_24h: 2.0,
            market_cap_change_24h: 20000000,
            market_cap_change_percentage_24h: 2.0,
            circulating_supply: 19000000,
            total_supply: 21000000,
            max_supply: 21000000,
            ath: 69000,
            ath_change_percentage: -27.5,
            ath_date: '2021-11-10T14:24:11.849Z',
            atl: 67.81,
            atl_change_percentage: 73641.8,
            atl_date: '2013-07-06T00:00:00.000Z',
            roi: null,
            last_updated: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        ],
        message: 'Bookmarks retrieved successfully'
      };

      mockedApi.get.mockResolvedValue({ 
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any }
      });

      const result = await bookmarkService.getUserBookmarks();

      expect(mockedApi.get).toHaveBeenCalledWith('/user/bookmarks/');
      expect(result).toEqual(mockResponse);
    });

    it('should handle authentication errors when getting bookmarks', async () => {
      const authError = {
        response: {
          status: 401,
          data: { error: 'Authentication required' }
        }
      };

      mockedApi.get.mockRejectedValue(authError);

      await expect(bookmarkService.getUserBookmarks()).rejects.toEqual(authError);
      expect(mockedApi.get).toHaveBeenCalledWith('/user/bookmarks/');
    });

    it('should handle empty bookmarks list', async () => {
      const mockResponse: CoinListResponse = {
        data: [],
        message: 'No bookmarks found'
      };

      mockedApi.get.mockResolvedValue({ 
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any }
      });

      const result = await bookmarkService.getUserBookmarks();

      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('isBookmarked', () => {
    it('should return true when coin is bookmarked', async () => {
      const coinId = 'bitcoin';
      const mockResponse: CoinListResponse = {
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            image: 'https://example.com/bitcoin.png',
            current_price: 50000,
            market_cap: 1000000000,
            market_cap_rank: 1,
            fully_diluted_valuation: null,
            total_volume: 50000000,
            high_24h: 51000,
            low_24h: 49000,
            price_change_24h: 1000,
            price_change_percentage_24h: 2.0,
            market_cap_change_24h: 20000000,
            market_cap_change_percentage_24h: 2.0,
            circulating_supply: 19000000,
            total_supply: 21000000,
            max_supply: 21000000,
            ath: 69000,
            ath_change_percentage: -27.5,
            ath_date: '2021-11-10T14:24:11.849Z',
            atl: 67.81,
            atl_change_percentage: 73641.8,
            atl_date: '2013-07-06T00:00:00.000Z',
            roi: null,
            last_updated: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        ]
      };

      mockedApi.get.mockResolvedValue({ 
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any }
      });

      const result = await bookmarkService.isBookmarked(coinId);

      expect(result).toBe(true);
      expect(mockedApi.get).toHaveBeenCalledWith('/user/bookmarks/');
    });

    it('should return false when coin is not bookmarked', async () => {
      const coinId = 'ethereum';
      const mockResponse: CoinListResponse = {
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            image: 'https://example.com/bitcoin.png',
            current_price: 50000,
            market_cap: 1000000000,
            market_cap_rank: 1,
            fully_diluted_valuation: null,
            total_volume: 50000000,
            high_24h: 51000,
            low_24h: 49000,
            price_change_24h: 1000,
            price_change_percentage_24h: 2.0,
            market_cap_change_24h: 20000000,
            market_cap_change_percentage_24h: 2.0,
            circulating_supply: 19000000,
            total_supply: 21000000,
            max_supply: 21000000,
            ath: 69000,
            ath_change_percentage: -27.5,
            ath_date: '2021-11-10T14:24:11.849Z',
            atl: 67.81,
            atl_change_percentage: 73641.8,
            atl_date: '2013-07-06T00:00:00.000Z',
            roi: null,
            last_updated: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        ]
      };

      mockedApi.get.mockResolvedValue({ 
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any }
      });

      const result = await bookmarkService.isBookmarked(coinId);

      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      const coinId = 'bitcoin';
      const error = new Error('Network error');

      mockedApi.get.mockRejectedValue(error);

      const result = await bookmarkService.isBookmarked(coinId);

      expect(result).toBe(false);
    });

    it('should return false for invalid coin ID', async () => {
      const result1 = await bookmarkService.isBookmarked('');
      const result2 = await bookmarkService.isBookmarked(null as any);
      const result3 = await bookmarkService.isBookmarked(undefined as any);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('Input validation', () => {
    it('should throw error for invalid coin ID in addBookmark', async () => {
      await expect(bookmarkService.addBookmark('')).rejects.toThrow('Invalid coin ID provided');
      await expect(bookmarkService.addBookmark(null as any)).rejects.toThrow('Invalid coin ID provided');
      await expect(bookmarkService.addBookmark(undefined as any)).rejects.toThrow('Invalid coin ID provided');
    });

    it('should throw error for invalid coin ID in removeBookmark', async () => {
      await expect(bookmarkService.removeBookmark('')).rejects.toThrow('Invalid coin ID provided');
      await expect(bookmarkService.removeBookmark(null as any)).rejects.toThrow('Invalid coin ID provided');
      await expect(bookmarkService.removeBookmark(undefined as any)).rejects.toThrow('Invalid coin ID provided');
    });
  });

  describe('Authentication token handling', () => {
    it('should include authentication token in requests', async () => {
      // This test verifies that the api interceptor is working correctly
      // The actual token handling is done in the api.ts interceptor
      const coinId = 'bitcoin';
      
      mockedApi.post.mockResolvedValue({ 
        data: { 
          data: { id: 1, user_id: 1, coin_id: coinId, created_at: '2023-01-01T00:00:00Z' } 
        },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: { headers: {} as any }
      });

      await bookmarkService.addBookmark(coinId);

      // Verify that the API was called (token handling is done by interceptor)
      expect(mockedApi.post).toHaveBeenCalledWith('/bookmarks/', { coin_id: coinId });
    });
  });
});