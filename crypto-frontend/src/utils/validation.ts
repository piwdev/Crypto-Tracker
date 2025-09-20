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
    const usernameRegex = /^[a-zA-Zひらがなカタカナ漢字]{1,20}$/;
    return usernameRegex.test(username);
  },

  // 必須フィールドの検証
  isRequired: (value: string): boolean => {
    return value.trim().length > 0;
  },
};