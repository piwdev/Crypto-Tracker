import { cryptoService } from './cryptoService';
import api from './api';
import { ApiError } from '../types/api';

// api モジュールをモック
jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('cryptoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCoinList', () => {
    it('should return coin list successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'bitcoin',
              symbol: 'btc',
              name: 'Bitcoin',
              market_cap_rank: 1,
              current_price: 50000,
              image: 'bitcoin.png'
            }
          ],
          message: 'Success'
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await cryptoService.getCoinList();

      expect(mockedApi.get).toHaveBeenCalledWith('/coins/');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw ApiError when response format is invalid', async () => {
      const mockResponse = {
        data: null
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await expect(cryptoService.getCoinList()).rejects.toThrow(ApiError);
      await expect(cryptoService.getCoinList()).rejects.toThrow('Invalid response format from server');
    });

    it('should throw ApiError when data is not an array', async () => {
      const mockResponse = {
        data: {
          data: 'not an array'
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await expect(cryptoService.getCoinList()).rejects.toThrow(ApiError);
      await expect(cryptoService.getCoinList()).rejects.toThrow('Expected array of coins but received different format');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error') as any;
      networkError.code = 'NETWORK_ERROR';

      mockedApi.get.mockRejectedValue(networkError);

      await expect(cryptoService.getCoinList()).rejects.toThrow(ApiError);
      await expect(cryptoService.getCoinList()).rejects.toThrow('ネットワークエラーが発生しました');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded') as any;
      timeoutError.code = 'ECONNABORTED';

      mockedApi.get.mockRejectedValue(timeoutError);

      await expect(cryptoService.getCoinList()).rejects.toThrow(ApiError);
      await expect(cryptoService.getCoinList()).rejects.toThrow('リクエストがタイムアウトしました');
    });
  });

  describe('getCoinDetail', () => {
    it('should return coin detail successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 50000,
            market_cap: 1000000000
          },
          message: 'Success'
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await cryptoService.getCoinDetail('bitcoin');

      expect(mockedApi.get).toHaveBeenCalledWith('/coins/bitcoin/');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw ApiError for invalid coinId', async () => {
      await expect(cryptoService.getCoinDetail('')).rejects.toThrow(ApiError);
      await expect(cryptoService.getCoinDetail('')).rejects.toThrow('有効なコインIDを指定してください');

      await expect(cryptoService.getCoinDetail('   ')).rejects.toThrow(ApiError);
      await expect(cryptoService.getCoinDetail('   ')).rejects.toThrow('有効なコインIDを指定してください');
    });

    it('should handle 404 errors', async () => {
      const notFoundError = {
        response: {
          status: 404
        }
      };

      mockedApi.get.mockRejectedValue(notFoundError);

      await expect(cryptoService.getCoinDetail('nonexistent')).rejects.toThrow(ApiError);
      await expect(cryptoService.getCoinDetail('nonexistent')).rejects.toThrow('指定された暗号通貨が見つかりません');
    });

    it('should throw ApiError when response format is invalid', async () => {
      const mockResponse = {
        data: null
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await expect(cryptoService.getCoinDetail('bitcoin')).rejects.toThrow(ApiError);
      await expect(cryptoService.getCoinDetail('bitcoin')).rejects.toThrow('Invalid response format from server');
    });

    it('should throw ApiError when coin data is incomplete', async () => {
      const mockResponse = {
        data: {
          data: {
            // Missing required fields like id, name, symbol
            current_price: 50000
          }
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await expect(cryptoService.getCoinDetail('bitcoin')).rejects.toThrow(ApiError);
      await expect(cryptoService.getCoinDetail('bitcoin')).rejects.toThrow('Incomplete coin data received from server');
    });

    it('should encode coinId properly', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'coin with spaces',
            symbol: 'cws',
            name: 'Coin With Spaces'
          }
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await cryptoService.getCoinDetail('coin with spaces');

      expect(mockedApi.get).toHaveBeenCalledWith('/coins/coin%20with%20spaces/');
    });
  });

  describe('healthCheck', () => {
    it('should return true when health check succeeds', async () => {
      mockedApi.get.mockResolvedValue({ status: 200 });

      const result = await cryptoService.healthCheck();

      expect(result).toBe(true);
      expect(mockedApi.get).toHaveBeenCalledWith('/health/', { timeout: 5000 });
    });

    it('should return false when health check fails', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));

      const result = await cryptoService.healthCheck();

      expect(result).toBe(false);
    });
  });
});