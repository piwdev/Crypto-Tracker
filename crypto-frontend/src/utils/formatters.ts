// Create formatters once to avoid recreation on each call
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

const percentageFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// Cache for large number formatting to avoid repeated calculations
const largeNumberCache = new Map<number, string>();

// 数値フォーマット関数
export const formatters = {
  // 通貨フォーマット（USD）
  formatCurrency: (value: number): string => {
    return currencyFormatter.format(value);
  },

  // パーセンテージフォーマット
  formatPercentage: (value: number): string => {
    return percentageFormatter.format(value / 100);
  },

  // 大きな数値のフォーマット（K, M, B, T）- with caching for performance
  formatLargeNumber: (value: number): string => {
    // Check cache first
    if (largeNumberCache.has(value)) {
      return largeNumberCache.get(value)!;
    }

    let result: string;
    if (value >= 1e12) {
      result = (value / 1e12).toFixed(2) + 'T';
    } else if (value >= 1e9) {
      result = (value / 1e9).toFixed(2) + 'B';
    } else if (value >= 1e6) {
      result = (value / 1e6).toFixed(2) + 'M';
    } else if (value >= 1e3) {
      result = (value / 1e3).toFixed(2) + 'K';
    } else {
      result = value.toFixed(2);
    }

    // Cache the result (limit cache size to prevent memory leaks)
    if (largeNumberCache.size < 1000) {
      largeNumberCache.set(value, result);
    }

    return result;
  },

  // 日付フォーマット
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return dateFormatter.format(date);
  },

  // 日時フォーマット
  formatDateTime: (dateString: string): string => {
    const date = new Date(dateString);
    return dateTimeFormatter.format(date);
  },
};