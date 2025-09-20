import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyPage } from '../pages/MyPage';
import '../i18n';

// Mock the CryptoTable component to avoid react-router-dom issues
jest.mock('../components/crypto/CryptoTable', () => ({
  CryptoTable: ({ loading, error, coins }: any) => {
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (coins.length === 0) return <div>No bookmarks yet</div>;
    return <div>Crypto Table with {coins.length} coins</div>;
  }
}));

// Mock the bookmark service
jest.mock('../services/bookmarkService', () => ({
  bookmarkService: {
    getUserBookmarks: jest.fn(),
  },
}));

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00Z',
      last_login_at: '2023-01-02T00:00:00Z',
    },
    isAuthenticated: true,
    loading: false,
    error: null,
  }),
}));

// Mock user data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00Z',
  last_login_at: '2023-01-02T00:00:00Z',
};

// Mock coins data
const mockCoins = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://example.com/bitcoin.png',
    current_price: 50000,
    market_cap: 1000000000,
    market_cap_rank: 1,
    fully_diluted_valuation: 1050000000,
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
    last_updated: '2023-01-01T12:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
  },
];

// Helper function to render component
const renderComponent = () => {
  return render(<MyPage />);
};

describe('MyPage', () => {
  it('renders user information correctly', () => {
    renderComponent();

    expect(screen.getByText('My Page')).toBeInTheDocument();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders bookmarks section', () => {
    renderComponent();

    expect(screen.getByText('My Bookmarks')).toBeInTheDocument();
  });
});