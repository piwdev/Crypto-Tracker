// アプリケーション定数
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CREATE_ACCOUNT: '/createaccount',
  MY_PAGE: '/mypage',
  DETAIL: '/detail',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    USER: '/auth/user/',
  },
  COINS: {
    LIST: '/coins/',
    DETAIL: (id: string) => `/coins/${id}/`,
  },
  BOOKMARKS: {
    LIST: '/user/bookmarks/',
    ADD: '/bookmarks/',
    REMOVE: (coinId: string) => `/bookmarks/${coinId}/`,
  },
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  LANGUAGE: 'language',
} as const;

export const SUPPORTED_LANGUAGES = {
  EN: 'en',
  JA: 'ja',
} as const;

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.EN;