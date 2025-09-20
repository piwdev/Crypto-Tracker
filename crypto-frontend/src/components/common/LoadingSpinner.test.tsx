import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import LoadingSpinner from './LoadingSpinner';

// Mock i18n for testing
const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    renderWithI18n(<LoadingSpinner />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Loading data...';
    renderWithI18n(<LoadingSpinner message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = renderWithI18n(<LoadingSpinner size="small" />);
    expect(document.querySelector('.loading-spinner--small')).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <LoadingSpinner size="large" />
      </I18nextProvider>
    );
    expect(document.querySelector('.loading-spinner--large')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-spinner';
    renderWithI18n(<LoadingSpinner className={customClass} />);
    
    expect(document.querySelector(`.${customClass}`)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithI18n(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });
});