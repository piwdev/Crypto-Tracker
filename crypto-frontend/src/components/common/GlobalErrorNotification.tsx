import React, { useEffect } from 'react';
import { useError } from '../../contexts/ErrorContext';
import ErrorMessage from './ErrorMessage';
import './GlobalErrorNotification.css';

const GlobalErrorNotification: React.FC = () => {
  const { errors, removeError } = useError();

  // エラーを自動的に削除するタイマー
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    errors.forEach((error) => {
      // 5秒後に自動的にエラーを削除（リトライ可能でない場合のみ）
      if (!error.retryable) {
        const timer = setTimeout(() => {
          removeError(error.id);
        }, 5000);
        timers.push(timer);
      }
    });

    // クリーンアップ
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [errors, removeError]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="global-error-notification">
      {errors.map((error) => (
        <div key={error.id} className="global-error-notification__item">
          <ErrorMessage
            message={error.message}
            type="error"
            showRetry={error.retryable}
            showClose={true}
            onRetry={error.onRetry}
            onClose={() => removeError(error.id)}
            className="global-error-notification__message"
          />
        </div>
      ))}
    </div>
  );
};

export default GlobalErrorNotification;