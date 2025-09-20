import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorMessage from './ErrorMessage';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // エラーが発生した時の状態更新
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラー情報を状態に保存
    this.setState({
      error,
      errorInfo,
    });

    // エラーログを出力
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 外部のエラーハンドラーを呼び出し
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // エラー報告サービスにエラーを送信（本番環境では実装）
    // this.reportError(error, errorInfo);
  }

  // エラー状態をリセット
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  // ページをリロード
  handleReload = () => {
    window.location.reload();
  };

  // エラー詳細を表示/非表示
  toggleErrorDetails = () => {
    const details = document.getElementById('error-details');
    if (details) {
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
  };

  render() {
    const { children, fallback } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      // カスタムフォールバックUIがある場合はそれを使用
      if (fallback) {
        return fallback;
      }

      // デフォルトのエラーUI
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__content">
              <h1 className="error-boundary__title">
                Something went wrong
              </h1>
              
              <ErrorMessage
                message="An unexpected error occurred in the application"
                type="error"
                showRetry={true}
                onRetry={this.handleReset}
              />

              <div className="error-boundary__actions">
                <button
                  className="error-boundary__button error-boundary__button--primary"
                  onClick={this.handleReset}
                >
                  Try Again
                </button>
                
                <button
                  className="error-boundary__button error-boundary__button--secondary"
                  onClick={this.handleReload}
                >
                  Reload Page
                </button>
              </div>

              {/* 開発環境でのエラー詳細表示 */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="error-boundary__debug">
                  <button
                    className="error-boundary__toggle"
                    onClick={this.toggleErrorDetails}
                  >
                    Show Error Details
                  </button>
                  
                  <div id="error-details" className="error-boundary__details" style={{ display: 'none' }}>
                    <h3>Error Details:</h3>
                    <pre className="error-boundary__stack">
                      {error.toString()}
                      {errorInfo && errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;