import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest, AuthContextType } from '../types/auth';
import { authService } from '../services/authService';
import { ApiError } from '../types/api';

// 認証状態の型定義
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// アクションの型定義
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// 初期状態
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// リデューサー関数
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// 拡張されたAuthContextType
interface ExtendedAuthContextType extends AuthContextType {
  error: string | null;
  clearError: () => void;
}

// AuthContextの作成
const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

// AuthProviderのProps型
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider コンポーネント
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初期化時に保存されたトークンから認証状態を復元
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const user = await authService.getCurrentUser();
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } catch (error) {
          // トークンが無効な場合は削除
          localStorage.removeItem('authToken');
          dispatch({ type: 'AUTH_FAILURE', payload: 'セッションが期限切れです' });
        }
      }
    };

    initializeAuth();
  }, []);

  // ログイン機能
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(credentials);
      
      // トークンをローカルストレージに保存
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
    } catch (error) {
      const apiError = error as ApiError;
      dispatch({ type: 'AUTH_FAILURE', payload: apiError.message });
      // Don't re-throw the error, just set it in state
    }
  };

  // ユーザー登録機能
  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.register(userData);
      
      // 登録後は自動的にログイン状態にする
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      } else {
        // トークンがない場合は登録のみ成功
        dispatch({ type: 'AUTH_FAILURE', payload: '' });
      }
    } catch (error) {
      const apiError = error as ApiError;
      dispatch({ type: 'AUTH_FAILURE', payload: apiError.message });
      // Don't re-throw the error, just set it in state
    }
  };

  // ログアウト機能
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      // ログアウトAPIが失敗してもローカルの状態はクリア
      console.error('Logout API failed:', error);
    } finally {
      // ローカルストレージからトークンを削除
      localStorage.removeItem('authToken');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // エラークリア機能
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // コンテキストの値
  const contextValue: ExtendedAuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth カスタムフック
export const useAuth = (): ExtendedAuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;