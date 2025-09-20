import React from 'react';
import { useTranslation } from 'react-i18next';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message,
  className = '' 
}) => {
  const { t } = useTranslation();

  const sizeClasses = {
    small: 'loading-spinner--small',
    medium: 'loading-spinner--medium',
    large: 'loading-spinner--large'
  };

  return (
    <div className={`loading-spinner ${className}`} role="status" aria-live="polite">
      <div className={`loading-spinner__circle ${sizeClasses[size]}`}>
        <div className="loading-spinner__inner"></div>
      </div>
      <span className="loading-spinner__message">
        {message || t('common.loading')}
      </span>
    </div>
  );
};

export default LoadingSpinner;