import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HomePage } from './HomePage';
import { cryptoService } from '../services/cryptoService';
import '../i18n'; // Import i18n configuration

// Mock the crypto service
jest.mock('../services/cryptoService');
const mockedCryptoService = cryptoService as jest.Mocked<typeof cryptoService>;

// Mock data
const mockCoins = [
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
    atl_change_percentage: 73600.0,
    atl_date: '2013-07-06T00:00:00.000Z',
    roi: null,
    last_updated: '2023-01-01T00:00:00.000Z',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  }
];

const renderHomePage = () => {
  return render(<HomePage />);
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockedCryptoService.getCoinList.mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    renderHomePage();
    
    expect(screen.getByText('Top 10 Cryptocurrencies')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders cryptocurrency data when loaded successfully', async () => {
    mockedCryptoService.getCoinList.mockResolvedValue({
      data: mockCoins
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Top 10 Cryptocurrencies')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    // Check if the table headers are present
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    const errorMessage = 'Network error';
    mockedCryptoService.getCoinList.mockRejectedValue(new Error(errorMessage));

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Top 10 Cryptocurrencies')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays page title and description', async () => {
    mockedCryptoService.getCoinList.mockResolvedValue({
      data: mockCoins
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Top 10 Cryptocurrencies')).toBeInTheDocument();
      expect(screen.getByText('Home - Top 10 Cryptocurrencies')).toBeInTheDocument();
    });
  });
});