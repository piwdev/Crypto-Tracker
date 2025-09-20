import React from 'react';
import { useTranslation } from 'react-i18next';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message?: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
  showRetry?: boolean;
  showClose?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = 'error',
  onRetry,
  onClose,
  className = '',
  showRetry = false,
  showClose = false
}) => {
  const { t } = useTranslation();

  const getErrorIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'warning':
        return t('errors.validationError');
      case 'info':
        return t('common.info');
      default:
        return t('errors.unknownError');
    }
  };

  return (
    <div 
      className={`error-message error-message--${type} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-message__content">
        <span className="error-message__icon" aria-hidden="true">
          {getErrorIcon()}
        </span>
        <span className="error-message__text">
          {message || getDefaultMessage()}
        </span>
      </div>
      
      {(showRetry || showClose) && (
        <div className="error-message__actions">
          {showRetry && onRetry && (
            <button
              className="error-message__button error-message__button--retry"
              onClick={onRetry}
              type="button"
            >
              {t('common.retry')}
            </button>
          )}
          {showClose && onClose && (
            <button
              className="error-message__button error-message__button--close"
              onClick={onClose}
              type="button"
              aria-label={t('common.close')}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;