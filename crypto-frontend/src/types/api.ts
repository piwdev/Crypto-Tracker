// API関連の型定義
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

/**
 * APIエラークラス
 * APIからのエラーレスポンスを統一的に処理するためのクラス
 */
export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    
    // TypeScriptでのError継承時の設定
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  next: string | null;
  previous: string | null;
}