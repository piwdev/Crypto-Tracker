import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import ErrorMessage from '../components/common/ErrorMessage';

// Mock i18n for testing
const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('ErrorMessage', () => {
  it('renders with default props', () => {
    renderWithI18n(<ErrorMessage />);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Custom error message';
    renderWithI18n(<ErrorMessage message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders different types correctly', () => {
    const { rerender } = renderWithI18n(<ErrorMessage type="warning" />);
    expect(document.querySelector('.error-message--warning')).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ErrorMessage type="info" />
      </I18nextProvider>
    );
    expect(document.querySelector('.error-message--info')).toBeInTheDocument();
  });

  it('shows retry button when showRetry is true and onRetry is provided', () => {
    const mockRetry = jest.fn();
    renderWithI18n(<ErrorMessage showRetry onRetry={mockRetry} />);
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('shows close button when showClose is true and onClose is provided', () => {
    const mockClose = jest.fn();
    renderWithI18n(<ErrorMessage showClose onClose={mockClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('does not show buttons when handlers are not provided', () => {
    renderWithI18n(<ErrorMessage showRetry showClose />);
    
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-error';
    renderWithI18n(<ErrorMessage className={customClass} />);
    
    expect(document.querySelector(`.${customClass}`)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithI18n(<ErrorMessage />);
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
  });
});