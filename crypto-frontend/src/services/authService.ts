import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import { ApiError } from '../types/api';

/**
 * 認証サービス
 * ログイン、登録、ログアウト機能とエラーハンドリングを提供
 */
export const authService = {
  /**
   * ユーザーログイン
   * @param credentials ログイン認証情報（email, password）
   * @returns Promise<AuthResponse> ユーザー情報とトークン
   * @throws ApiError ログインに失敗した場合
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      // 入力値の基本検証
      if (!credentials.email || !credentials.password) {
        throw new ApiError('メールアドレスとパスワードを入力してください', 400);
      }

      const response = await api.post('/auth/login/', credentials);
      
      // レスポンスの検証
      if (!response.data || !response.data.user) {
        throw new ApiError('ログインレスポンスが無効です', 500);
      }

      return response.data;
    } catch (error) {
      // APIエラーの場合はそのまま再スロー
      if (error instanceof ApiError) {
        throw error;
      }
      
      // その他のエラーの場合は適切なエラーメッセージに変換
      const apiError = error as any;
      if (apiError.response?.status === 401) {
        throw new ApiError('メールアドレスまたはパスワードが正しくありません', 401);
      } else if (apiError.response?.status === 400) {
        throw new ApiError(apiError.response.data?.error || 'ログイン情報が正しくありません', 400);
      } else {
        throw new ApiError('ログインに失敗しました。しばらく時間をおいて再度お試しください', 500);
      }
    }
  },

  /**
   * ユーザー登録
   * @param userData 登録情報（email, password, username）
   * @returns Promise<AuthResponse> ユーザー情報とトークン（オプション）
   * @throws ApiError 登録に失敗した場合
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      // 入力値の基本検証
      if (!userData.email || !userData.password || !userData.username) {
        throw new ApiError('すべての項目を入力してください', 400);
      }

      // メール形式の検証
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new ApiError('正しいメールアドレス形式で入力してください', 400);
      }

      // パスワードの検証（4-20文字、英数字のみ）
      const passwordRegex = /^[a-zA-Z0-9]{4,20}$/;
      if (!passwordRegex.test(userData.password)) {
        throw new ApiError('パスワードは英数字4-20文字で入力してください', 400);
      }

      // ユーザー名の検証（1-20文字、英字または日本語）
      const usernameRegex = /^[a-zA-Zあ-んア-ンー一-龯ぁ-ゔゞ゠-ヾ]{1,20}$/;
      if (!usernameRegex.test(userData.username)) {
        throw new ApiError('ユーザー名は英字または日本語1-20文字で入力してください', 400);
      }

      const response = await api.post('/auth/register/', userData);
      
      // レスポンスの検証
      if (!response.data || !response.data.user) {
        throw new ApiError('登録レスポンスが無効です', 500);
      }

      return response.data;
    } catch (error) {
      // APIエラーの場合はそのまま再スロー
      if (error instanceof ApiError) {
        throw error;
      }
      
      // その他のエラーの場合は適切なエラーメッセージに変換
      const apiError = error as any;
      if (apiError.response?.status === 400) {
        const errorMessage = apiError.response.data?.error;
        if (errorMessage && (errorMessage.includes('email') || errorMessage.includes('Email'))) {
          throw new ApiError('既に登録されているメールアドレスです', 400);
        }
        throw new ApiError(errorMessage || '登録情報が正しくありません', 400);
      } else {
        throw new ApiError('アカウント作成に失敗しました。しばらく時間をおいて再度お試しください', 500);
      }
    }
  },

  /**
   * ユーザーログアウト
   * @returns Promise<void>
   * @throws ApiError ログアウトに失敗した場合（ただし、ローカルの状態はクリアされる）
   */
  logout: async (): Promise<void> => {
    try {
      // サーバーサイドでのセッション無効化
      await api.post('/auth/logout/');
    } catch (error) {
      // ログアウトAPIが失敗してもローカルの状態はクリア
      console.warn('ログアウトAPIが失敗しましたが、ローカルセッションをクリアします:', error);
    } finally {
      // ローカルストレージからトークンを削除
      localStorage.removeItem('authToken');
    }
  },

  /**
   * 現在のユーザー情報取得
   * @returns Promise<User> 現在のユーザー情報
   * @throws ApiError ユーザー情報の取得に失敗した場合
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/user/');
      
      // レスポンスの検証
      if (!response.data) {
        throw new ApiError('ユーザー情報が取得できませんでした', 500);
      }

      return response.data;
    } catch (error) {
      // APIエラーの場合はそのまま再スロー
      if (error instanceof ApiError) {
        throw error;
      }
      
      // その他のエラーの場合は適切なエラーメッセージに変換
      const apiError = error as any;
      if (apiError.response?.status === 401) {
        throw new ApiError('認証が必要です', 401);
      } else {
        throw new ApiError('ユーザー情報の取得に失敗しました', 500);
      }
    }
  },

  /**
   * 認証トークンの有効性チェック
   * @returns boolean トークンが存在し、有効である可能性が高い場合はtrue
   */
  hasValidToken: (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  /**
   * 認証トークンの取得
   * @returns string | null 保存されているトークン、存在しない場合はnull
   */
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  /**
   * 認証トークンの削除
   * ログアウト時やトークンが無効になった時に使用
   */
  clearToken: (): void => {
    localStorage.removeItem('authToken');
  },

  /**
   * パスワード強度の検証
   * @param password 検証するパスワード
   * @returns boolean パスワードが要件を満たす場合はtrue
   */
  validatePassword: (password: string): boolean => {
    const passwordRegex = /^[a-zA-Z0-9]{4,20}$/;
    return passwordRegex.test(password);
  },

  /**
   * メールアドレス形式の検証
   * @param email 検証するメールアドレス
   * @returns boolean メールアドレスが正しい形式の場合はtrue
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * ユーザー名の検証
   * @param username 検証するユーザー名
   * @returns boolean ユーザー名が要件を満たす場合はtrue
   */
  validateUsername: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Zあ-んア-ンー一-龯ぁ-ゔゞ゠-ヾ]{1,20}$/;
    return usernameRegex.test(username);
  },
};