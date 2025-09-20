import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './contexts';

// Test wrapper with AuthProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

test('renders crypto bookmark app', () => {
  render(<App />, { wrapper: TestWrapper });
  const titleElement = screen.getByText(/crypto bookmark app/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders initialization message', () => {
  render(<App />, { wrapper: TestWrapper });
  const messageElement = screen.getByText(/frontend project initialized successfully/i);
  expect(messageElement).toBeInTheDocument();
});

test('renders authentication status', () => {
  render(<App />, { wrapper: TestWrapper });
  const authStatusElement = screen.getByText(/authentication status/i);
  expect(authStatusElement).toBeInTheDocument();
});

test('shows not authenticated by default', () => {
  render(<App />, { wrapper: TestWrapper });
  const notAuthenticatedElement = screen.getByText(/❌ not authenticated/i);
  expect(notAuthenticatedElement).toBeInTheDocument();
});
