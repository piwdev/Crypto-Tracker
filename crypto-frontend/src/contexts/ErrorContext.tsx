import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// エラーの種類を定義
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

// エラー情報の型定義
export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  retryable?: boolean;
  onRetry?: () => void;
}

// エラー状態の型定義
interface ErrorState {
  errors: AppError[];
  globalError: AppError | null;
}

// アクションの型定義
type ErrorAction =
  | { type: 'ADD_ERROR'; payload: Omit<AppError, 'id' | 'timestamp'> }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_GLOBAL_ERROR'; payload: Omit<AppError, 'id' | 'timestamp'> | null }
  | { type: 'CLEAR_GLOBAL_ERROR' };

// 初期状態
const initialState: ErrorState = {
  errors: [],
  globalError: null,
};

// エラーIDを生成する関数
const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// リデューサー関数
const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'ADD_ERROR':
      const newError: AppError = {
        ...action.payload,
        id: generateErrorId(),
        timestamp: new Date(),
      };
      return {
        ...state,
        errors: [...state.errors, newError],
      };
    
    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload),
      };
    
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };
    
    case 'SET_GLOBAL_ERROR':
      const globalError = action.payload ? {
        ...action.payload,
        id: generateErrorId(),
        timestamp: new Date(),
      } : null;
      return {
        ...state,
        globalError,
      };
    
    case 'CLEAR_GLOBAL_ERROR':
      return {
        ...state,
        globalError: null,
      };
    
    default:
      return state;
  }
};

// ErrorContextの型定義
interface ErrorContextType {
  errors: AppError[];
  globalError: AppError | null;
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  setGlobalError: (error: Omit<AppError, 'id' | 'timestamp'> | null) => void;
  clearGlobalError: () => void;
  handleApiError: (error: any, retryFn?: () => void) => void;
  handleNetworkError: (error: any, retryFn?: () => void) => void;
}

// ErrorContextの作成
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// ErrorProviderのProps型
interface ErrorProviderProps {
  children: ReactNode;
}

// ErrorProvider コンポーネント
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);
  const { t } = useTranslation();

  // エラーを追加
  const addError = (error: Omit<AppError, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
  };

  // エラーを削除
  const removeError = (id: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: id });
  };

  // すべてのエラーをクリア
  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  // グローバルエラーを設定
  const setGlobalError = (error: Omit<AppError, 'id' | 'timestamp'> | null) => {
    dispatch({ type: 'SET_GLOBAL_ERROR', payload: error });
  };

  // グローバルエラーをクリア
  const clearGlobalError = () => {
    dispatch({ type: 'CLEAR_GLOBAL_ERROR' });
  };

  // APIエラーを処理
  const handleApiError = (error: any, retryFn?: () => void) => {
    let errorType: ErrorType;
    let message: string;
    let retryable = false;

    if (error.response) {
      // サーバーからのレスポンスがある場合
      const status = error.response.status;
      
      switch (status) {
        case 400:
          errorType = ErrorType.VALIDATION;
          message = error.response.data?.error || t('errors.validationError');
          break;
        case 401:
          errorType = ErrorType.AUTHENTICATION;
          message = t('errors.unauthorized');
          break;
        case 403:
          errorType = ErrorType.AUTHORIZATION;
          message = t('errors.forbidden');
          break;
        case 404:
          errorType = ErrorType.NOT_FOUND;
          message = t('errors.notFound');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = ErrorType.SERVER;
          message = t('errors.serverError');
          retryable = true;
          break;
        default:
          errorType = ErrorType.UNKNOWN;
          message = error.response.data?.error || t('errors.unknownError');
          retryable = true;
      }
    } else if (error.request) {
      // ネットワークエラー
      errorType = ErrorType.NETWORK;
      message = t('errors.networkError');
      retryable = true;
    } else {
      // その他のエラー
      errorType = ErrorType.UNKNOWN;
      message = error.message || t('errors.unknownError');
    }

    addError({
      type: errorType,
      message,
      details: error,
      retryable,
      onRetry: retryable ? retryFn : undefined,
    });
  };

  // ネットワークエラーを処理
  const handleNetworkError = (error: any, retryFn?: () => void) => {
    addError({
      type: ErrorType.NETWORK,
      message: t('errors.networkError'),
      details: error,
      retryable: true,
      onRetry: retryFn,
    });
  };

  const contextValue: ErrorContextType = {
    errors: state.errors,
    globalError: state.globalError,
    addError,
    removeError,
    clearErrors,
    setGlobalError,
    clearGlobalError,
    handleApiError,
    handleNetworkError,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

// useError カスタムフック
export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;