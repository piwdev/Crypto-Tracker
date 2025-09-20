import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';

// Mock the auth service
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    register: jest.fn(),
    hasValidToken: jest.fn(),
    getToken: jest.fn(),
    clearToken: jest.fn(),
    validatePassword: jest.fn(),
    validateEmail: jest.fn(),
    validateUsername: jest.fn(),
  },
}));

const mockedLogin = authService.login as jest.MockedFunction<typeof authService.login>;
const mockedLogout = authService.logout as jest.MockedFunction<typeof authService.logout>;
const mockedGetCurrentUser = authService.getCurrentUser as jest.MockedFunction<typeof authService.getCurrentUser>;

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const { user, isAuthenticated, loading, login, logout, error } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{user ? `User: ${user.username}` : 'No User'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

const renderWithAuthProvider = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('provides initial unauthenticated state', () => {
    renderWithAuthProvider(<TestComponent />);
    
    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
  });

  test('handles successful login', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00Z',
      last_login_at: null
    };

    mockedLogin.mockResolvedValue({
      user: mockUser,
      token: 'mock-token'
    });

    renderWithAuthProvider(<TestComponent />);
    
    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('User: testuser');
    });

    expect(localStorage.getItem('authToken')).toBe('mock-token');
    expect(mockedLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });

  test('handles login failure', async () => {
    const mockError = {
      message: 'Invalid credentials',
      status: 401,
      details: {}
    };

    mockedLogin.mockRejectedValue(mockError);

    renderWithAuthProvider(<TestComponent />);
    
    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    });

    expect(localStorage.getItem('authToken')).toBeNull();
  });

  test('handles logout', async () => {
    // First set up authenticated state
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00Z',
      last_login_at: null
    };

    mockedLogin.mockResolvedValue({
      user: mockUser,
      token: 'mock-token'
    });

    mockedLogout.mockResolvedValue();

    renderWithAuthProvider(<TestComponent />);
    
    // Login first
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });

    // Now logout
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(mockedLogout).toHaveBeenCalled();
  });

  test('restores authentication from localStorage on initialization', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00Z',
      last_login_at: null
    };

    // Set token in localStorage
    localStorage.setItem('authToken', 'existing-token');
    
    mockedGetCurrentUser.mockResolvedValue(mockUser);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('User: testuser');
    });

    expect(mockedGetCurrentUser).toHaveBeenCalled();
  });

  test('handles invalid token on initialization', async () => {
    // Set invalid token in localStorage
    localStorage.setItem('authToken', 'invalid-token');
    
    mockedGetCurrentUser.mockRejectedValue({
      message: 'Invalid token',
      status: 401
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('error')).toHaveTextContent('セッションが期限切れです');
    });

    expect(localStorage.getItem('authToken')).toBeNull();
  });

  test('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});