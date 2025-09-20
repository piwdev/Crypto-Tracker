import { authService } from './authService';
import api from './api';
import { ApiError } from '../types/api';
import { LoginRequest, RegisterRequest } from '../types/auth';

// APIモジュールをモック
jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

// localStorageのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('login', () => {
    const validCredentials: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockAuthResponse = {
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        last_login_at: null,
      },
      token: 'mock-token',
    };

    it('should successfully login with valid credentials', async () => {
      mockedApi.post.mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.login(validCredentials);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login/', validCredentials);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw ApiError when email is missing', async () => {
      const invalidCredentials = { email: '', password: 'password123' };

      await expect(authService.login(invalidCredentials)).rejects.toThrow(
        new ApiError('メールアドレスとパスワードを入力してください', 400)
      );

      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should throw ApiError when password is missing', async () => {
      const invalidCredentials = { email: 'test@example.com', password: '' };

      await expect(authService.login(invalidCredentials)).rejects.toThrow(
        new ApiError('メールアドレスとパスワードを入力してください', 400)
      );

      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should throw ApiError when API returns 401', async () => {
      const apiError = {
        response: { status: 401, data: { error: 'Invalid credentials' } },
      };
      mockedApi.post.mockRejectedValue(apiError);

      await expect(authService.login(validCredentials)).rejects.toThrow(
        new ApiError('メールアドレスまたはパスワードが正しくありません', 401)
      );
    });

    it('should throw ApiError when API returns 400', async () => {
      const apiError = {
        response: { status: 400, data: { error: 'Bad request' } },
      };
      mockedApi.post.mockRejectedValue(apiError);

      await expect(authService.login(validCredentials)).rejects.toThrow(
        new ApiError('Bad request', 400)
      );
    });

    it('should throw generic ApiError for other errors', async () => {
      const apiError = {
        response: { status: 500, data: { error: 'Server error' } },
      };
      mockedApi.post.mockRejectedValue(apiError);

      await expect(authService.login(validCredentials)).rejects.toThrow(
        new ApiError('ログインに失敗しました。しばらく時間をおいて再度お試しください', 500)
      );
    });

    it('should throw ApiError when response data is invalid', async () => {
      mockedApi.post.mockResolvedValue({ data: null });

      await expect(authService.login(validCredentials)).rejects.toThrow(
        new ApiError('ログインレスポンスが無効です', 500)
      );
    });
  });

  describe('register', () => {
    const validUserData: RegisterRequest = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    };

    const mockAuthResponse = {
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        last_login_at: null,
      },
      token: 'mock-token',
    };

    it('should successfully register with valid data', async () => {
      mockedApi.post.mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.register(validUserData);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register/', validUserData);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw ApiError when email is missing', async () => {
      const invalidData = { ...validUserData, email: '' };

      await expect(authService.register(invalidData)).rejects.toThrow(
        new ApiError('すべての項目を入力してください', 400)
      );
    });

    it('should throw ApiError when email format is invalid', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      await expect(authService.register(invalidData)).rejects.toThrow(
        new ApiError('正しいメールアドレス形式で入力してください', 400)
      );
    });

    it('should throw ApiError when password format is invalid', async () => {
      const invalidData = { ...validUserData, password: 'abc' }; // Too short

      await expect(authService.register(invalidData)).rejects.toThrow(
        new ApiError('パスワードは英数字4-20文字で入力してください', 400)
      );
    });

    it('should throw ApiError when password contains special characters', async () => {
      const invalidData = { ...validUserData, password: 'password@123' };

      await expect(authService.register(invalidData)).rejects.toThrow(
        new ApiError('パスワードは英数字4-20文字で入力してください', 400)
      );
    });

    it('should throw ApiError when username format is invalid', async () => {
      const invalidData = { ...validUserData, username: 'user@123' }; // Contains special characters

      await expect(authService.register(invalidData)).rejects.toThrow(
        new ApiError('ユーザー名は英字または日本語1-20文字で入力してください', 400)
      );
    });

    it('should accept Japanese username', async () => {
      const validDataWithJapanese = { ...validUserData, username: 'テストユーザー' };
      mockedApi.post.mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.register(validDataWithJapanese);

      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw ApiError when email already exists', async () => {
      const apiError = {
        response: { status: 400, data: { error: 'Email already exists' } },
      };
      mockedApi.post.mockRejectedValue(apiError);

      await expect(authService.register(validUserData)).rejects.toThrow(
        new ApiError('既に登録されているメールアドレスです', 400)
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout and clear token', async () => {
      mockedApi.post.mockResolvedValue({});

      await authService.logout();

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout/');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should clear token even when API call fails', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockedApi.post.mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getCurrentUser', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00Z',
      last_login_at: null,
    };

    it('should successfully get current user', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/user/');
      expect(result).toEqual(mockUser);
    });

    it('should throw ApiError when response data is null', async () => {
      mockedApi.get.mockResolvedValue({ data: null });

      await expect(authService.getCurrentUser()).rejects.toThrow(
        new ApiError('ユーザー情報が取得できませんでした', 500)
      );
    });

    it('should throw ApiError when API returns 401', async () => {
      const apiError = {
        response: { status: 401, data: { error: 'Unauthorized' } },
      };
      mockedApi.get.mockRejectedValue(apiError);

      await expect(authService.getCurrentUser()).rejects.toThrow(
        new ApiError('認証が必要です', 401)
      );
    });
  });

  describe('hasValidToken', () => {
    it('should return true when token exists', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const result = authService.hasValidToken();

      expect(result).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    });

    it('should return false when token does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = authService.hasValidToken();

      expect(result).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token when it exists', () => {
      const mockToken = 'mock-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      const result = authService.getToken();

      expect(result).toBe(mockToken);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    });

    it('should return null when token does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = authService.getToken();

      expect(result).toBeNull();
    });
  });

  describe('clearToken', () => {
    it('should remove token from localStorage', () => {
      authService.clearToken();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid passwords', () => {
      expect(authService.validatePassword('password123')).toBe(true);
      expect(authService.validatePassword('abcd')).toBe(true);
      expect(authService.validatePassword('12345678901234567890')).toBe(true); // 20 chars
    });

    it('should return false for invalid passwords', () => {
      expect(authService.validatePassword('abc')).toBe(false); // Too short
      expect(authService.validatePassword('123456789012345678901')).toBe(false); // Too long
      expect(authService.validatePassword('password@123')).toBe(false); // Special characters
      expect(authService.validatePassword('')).toBe(false); // Empty
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(authService.validateEmail('test@example.com')).toBe(true);
      expect(authService.validateEmail('user.name@domain.co.jp')).toBe(true);
      expect(authService.validateEmail('test123@test-domain.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(authService.validateEmail('invalid-email')).toBe(false);
      expect(authService.validateEmail('test@')).toBe(false);
      expect(authService.validateEmail('@example.com')).toBe(false);
      expect(authService.validateEmail('test@.com')).toBe(false);
      expect(authService.validateEmail('')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('should return true for valid usernames', () => {
      expect(authService.validateUsername('testuser')).toBe(true);
      expect(authService.validateUsername('TestUser')).toBe(true);
      expect(authService.validateUsername('テストユーザー')).toBe(true);
      expect(authService.validateUsername('ユーザー名')).toBe(true);
      expect(authService.validateUsername('a')).toBe(true); // 1 char
      expect(authService.validateUsername('abcdefghijklmnopqrst')).toBe(true); // 20 chars
    });

    it('should return false for invalid usernames', () => {
      expect(authService.validateUsername('')).toBe(false); // Empty
      expect(authService.validateUsername('user123')).toBe(false); // Contains numbers
      expect(authService.validateUsername('user@name')).toBe(false); // Special characters
      expect(authService.validateUsername('abcdefghijklmnopqrstu')).toBe(false); // Too long (21 chars)
    });
  });
});