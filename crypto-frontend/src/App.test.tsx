import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders crypto bookmark app', () => {
  render(<App />);
  const titleElement = screen.getByText(/crypto bookmark app/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders initialization message', () => {
  render(<App />);
  const messageElement = screen.getByText(/frontend project initialized successfully/i);
  expect(messageElement).toBeInTheDocument();
});
