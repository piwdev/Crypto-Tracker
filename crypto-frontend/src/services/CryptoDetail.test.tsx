import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CryptoDetail from '../components/crypto/CryptoDetail';
import { cryptoService } from './cryptoService';
import { Coin } from '../types/crypto';

// Mock the crypto service
jest.mock('./cryptoService');
const mockCryptoService = cryptoService as jest.Mocked<typeof cryptoService>;

// Mock the BookmarkButton component
jest.mock('./BookmarkButton', () => {
  return function MockBookmarkButton() {
    return <div data-testid="bookmark-button">Bookmark Button</div>;
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'crypto.coinNotFound': 'Cryptocurrency not found',
        'crypto.notAvailable': 'N/A',
        'crypto.currentPrice': 'Current Price',
        'crypto.name': 'Name',
        'crypto.symbol': 'Symbol',
        'crypto.marketCapRank': 'Market Cap Rank',
        'crypto.priceChange24h': 'Price Change (24h)',
        'crypto.priceChangePercentage24h': 'Price Change % (24h)',
        'crypto.high24h': '24h High',
        'crypto.low24h': '24h Low',
        'crypto.marketCap': 'Market Cap',
        'crypto.fullyDilutedValuation': 'Fully Diluted Valuation',
        'crypto.marketCapChange24h': 'Market Cap Change (24h)',
        'crypto.marketCapChangePercentage24h': 'Market Cap Change % (24h)',
        'crypto.totalVolume': 'Total Volume',
        'crypto.volume': 'Volume',
        'crypto.supply': 'Supply',
        'crypto.circulatingSupply': 'Circulating Supply',
        'crypto.totalSupply': 'Total Supply',
        'crypto.maxSupply': 'Max Supply',
        'crypto.allTimeHigh': 'All Time High',
        'crypto.athChangePercentage': 'ATH Change %',
        'crypto.athDate': 'ATH Date',
        'crypto.allTimeLow': 'All Time Low',
        'crypto.atlChangePercentage': 'ATL Change %',
        'crypto.atlDate': 'ATL Date',
        'crypto.lastUpdated': 'Last Updated',
        'crypto.price': 'Price',
        'common.info': 'Information',
        'common.loading': 'Loading...',
        'common.retry': 'Retry',
        'errors.serverError': 'Server error. Please try again later.',
        'errors.networkError': 'Network error. Please check your connection.',
        'errors.unknownError': 'An unknown error occurred'
      };
      return translations[key] || key;
    }
  })
}));

const mockCoin: Coin = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://example.com/bitcoin.png',
  current_price: 45000,
  market_cap: 850000000000,
  market_cap_rank: 1,
  fully_diluted_valuation: 945000000000,
  total_volume: 25000000000,
  high_24h: 46000,
  low_24h: 44000,
  price_change_24h: 1000,
  price_change_percentage_24h: 2.27,
  market_cap_change_24h: 19000000000,
  market_cap_change_percentage_24h: 2.28,
  circulating_supply: 19500000,
  total_supply: 21000000,
  max_supply: 21000000,
  ath: 69000,
  ath_change_percentage: -34.78,
  ath_date: '2021-11-10T14:24:11.849Z',
  atl: 67.81,
  atl_change_percentage: 66284.12,
  atl_date: '2013-07-06T00:00:00.000Z',
  roi: null,
  last_updated: '2024-01-15T10:30:00.000Z',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-15T10:30:00.000Z'
};

describe('CryptoDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockCryptoService.getCoinDetail.mockImplementation(() => new Promise(() => {}));
    
    render(<CryptoDetail coinId="bitcoin" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders coin details successfully', async () => {
    mockCryptoService.getCoinDetail.mockResolvedValue({
      data: mockCoin,
      message: 'Success'
    });

    render(<CryptoDetail coinId="bitcoin" />);

    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    expect(screen.getByText('(BTC)')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('$45,000.00')).toBeInTheDocument();
  });

  it('renders error when coin is not found', async () => {
    const error = new Error('Not found');
    (error as any).response = { status: 404 };
    mockCryptoService.getCoinDetail.mockRejectedValue(error);

    render(<CryptoDetail coinId="nonexistent" />);

    await waitFor(() => {
      expect(screen.getByText('Cryptocurrency not found')).toBeInTheDocument();
    });
  });

  it('renders server error message', async () => {
    const error = new Error('Server error');
    (error as any).response = { status: 500 };
    mockCryptoService.getCoinDetail.mockRejectedValue(error);

    render(<CryptoDetail coinId="bitcoin" />);

    await waitFor(() => {
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
    });
  });

  it('renders network error message', async () => {
    const error = new Error('Network error');
    (error as any).code = 'NETWORK_ERROR';
    mockCryptoService.getCoinDetail.mockRejectedValue(error);

    render(<CryptoDetail coinId="bitcoin" />);

    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection.')).toBeInTheDocument();
    });
  });

  it('handles retry functionality', async () => {
    const error = new Error('Server error');
    (error as any).response = { status: 500 };
    mockCryptoService.getCoinDetail
      .mockRejectedValueOnce(error)
      .mockResolvedValue({
        data: mockCoin,
        message: 'Success'
      });

    render(<CryptoDetail coinId="bitcoin" />);

    await waitFor(() => {
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
  });

  it('displays N/A for null values', async () => {
    const coinWithNulls: Coin = {
      ...mockCoin,
      fully_diluted_valuation: null,
      total_supply: null,
      max_supply: null
    };

    mockCryptoService.getCoinDetail.mockResolvedValue({
      data: coinWithNulls,
      message: 'Success'
    });

    render(<CryptoDetail coinId="bitcoin" />);

    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    // Should show N/A for null values
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('applies correct CSS classes for positive and negative changes', async () => {
    mockCryptoService.getCoinDetail.mockResolvedValue({
      data: mockCoin,
      message: 'Success'
    });

    render(<CryptoDetail coinId="bitcoin" />);

    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    // Check for positive change class (price_change_24h is positive)
    const positiveElements = document.querySelectorAll('.crypto-detail__positive');
    expect(positiveElements.length).toBeGreaterThan(0);

    // Check for negative change class (ath_change_percentage is negative)
    const negativeElements = document.querySelectorAll('.crypto-detail__negative');
    expect(negativeElements.length).toBeGreaterThan(0);
  });

  it('handles image error gracefully', async () => {
    mockCryptoService.getCoinDetail.mockResolvedValue({
      data: mockCoin,
      message: 'Success'
    });

    render(<CryptoDetail coinId="bitcoin" />);

    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    const image = screen.getByAltText('Bitcoin') as HTMLImageElement;
    
    // Simulate image error
    fireEvent.error(image);
    
    expect(image.style.display).toBe('none');
  });
});