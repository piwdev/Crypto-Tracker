// バリデーション結果の型定義
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

// バリデーションルールの型定義
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => ValidationResult;
}

// フィールドバリデーション設定
export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

// バリデーション関数
export const validation = {
  // メールアドレスの検証
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // パスワードの検証（アルファベットと数字のみ、4-20文字）
  isValidPassword: (password: string): boolean => {
    const passwordRegex = /^[a-zA-Z0-9]{4,20}$/;
    return passwordRegex.test(password);
  },

  // ユーザー名の検証（アルファベットまたは日本語文字、1-20文字）
  isValidUsername: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Zあ-んア-ンー一-龯ぁ-ゔゞ゠-ヾ]{1,20}$/;
    return usernameRegex.test(username);
  },

  // 必須フィールドの検証
  isRequired: (value: string): boolean => {
    return value.trim().length > 0;
  },

  // 詳細なメールバリデーション
  validateEmail: (email: string): ValidationResult => {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: 'auth.emailRequired' };
    }

    const trimmedEmail = email.trim();
    
    // 基本的な形式チェック
    if (!validation.isValidEmail(trimmedEmail)) {
      return { isValid: false, error: 'auth.invalidEmail' };
    }

    // 長さチェック
    if (trimmedEmail.length > 254) {
      return { isValid: false, error: 'auth.emailTooLong' };
    }

    // 一般的でない文字のチェック
    const suspiciousChars = /[<>()[\]\\,;:\s@"]/;
    if (suspiciousChars.test(trimmedEmail.split('@')[0])) {
      return { 
        isValid: true, 
        warnings: ['auth.emailSuspiciousChars'] 
      };
    }

    return { isValid: true };
  },

  // 詳細なパスワードバリデーション
  validatePassword: (password: string): ValidationResult => {
    if (!password || password.length === 0) {
      return { isValid: false, error: 'auth.passwordRequired' };
    }

    // 長さチェック
    if (password.length < 4) {
      return { isValid: false, error: 'auth.passwordTooShort' };
    }

    if (password.length > 20) {
      return { isValid: false, error: 'auth.passwordTooLong' };
    }

    // 文字種チェック
    if (!validation.isValidPassword(password)) {
      return { isValid: false, error: 'auth.invalidPassword' };
    }

    // パスワード強度チェック
    const warnings: string[] = [];
    
    if (!/[a-zA-Z]/.test(password)) {
      warnings.push('auth.passwordNoLetters');
    }
    
    if (!/[0-9]/.test(password)) {
      warnings.push('auth.passwordNoNumbers');
    }

    if (password.length < 8) {
      warnings.push('auth.passwordRecommendLonger');
    }

    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  },

  // 詳細なユーザー名バリデーション
  validateUsername: (username: string): ValidationResult => {
    if (!username || username.trim().length === 0) {
      return { isValid: false, error: 'auth.usernameRequired' };
    }

    const trimmedUsername = username.trim();

    // 長さチェック
    if (trimmedUsername.length > 20) {
      return { isValid: false, error: 'auth.usernameTooLong' };
    }

    // 文字種チェック
    if (!validation.isValidUsername(trimmedUsername)) {
      return { isValid: false, error: 'auth.invalidUsername' };
    }

    // 推奨事項
    const warnings: string[] = [];
    
    if (trimmedUsername.length < 3) {
      warnings.push('auth.usernameRecommendLonger');
    }

    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  },

  // 汎用フィールドバリデーション
  validateField: (value: string, rules: ValidationRule): ValidationResult => {
    // 必須チェック
    if (rules.required && (!value || value.trim().length === 0)) {
      return { isValid: false, error: 'validation.required' };
    }

    // 値が空の場合で必須でない場合は有効
    if (!value || value.trim().length === 0) {
      return { isValid: true };
    }

    const trimmedValue = value.trim();

    // 最小長チェック
    if (rules.minLength && trimmedValue.length < rules.minLength) {
      return { 
        isValid: false, 
        error: 'validation.minLength',
      };
    }

    // 最大長チェック
    if (rules.maxLength && trimmedValue.length > rules.maxLength) {
      return { 
        isValid: false, 
        error: 'validation.maxLength',
      };
    }

    // パターンチェック
    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
      return { isValid: false, error: 'validation.pattern' };
    }

    // カスタムバリデーション
    if (rules.custom) {
      return rules.custom(trimmedValue);
    }

    return { isValid: true };
  },

  // フォーム全体のバリデーション
  validateForm: (formData: Record<string, string>, fieldRules: FieldValidation): Record<string, ValidationResult> => {
    const results: Record<string, ValidationResult> = {};

    Object.keys(fieldRules).forEach(fieldName => {
      const value = formData[fieldName] || '';
      const rules = fieldRules[fieldName];
      results[fieldName] = validation.validateField(value, rules);
    });

    return results;
  },

  // バリデーション結果からエラーメッセージを取得
  getErrorMessage: (result: ValidationResult, fieldName?: string): string | undefined => {
    if (result.isValid || !result.error) {
      return undefined;
    }
    return result.error;
  },

  // バリデーション結果から警告メッセージを取得
  getWarningMessages: (result: ValidationResult): string[] => {
    return result.warnings || [];
  },

  // フォームが有効かどうかをチェック
  isFormValid: (results: Record<string, ValidationResult>): boolean => {
    return Object.values(results).every(result => result.isValid);
  },
};