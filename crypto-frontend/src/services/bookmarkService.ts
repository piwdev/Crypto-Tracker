import api from './api';
import { BookmarkResponse, CoinListResponse } from '../types/crypto';

export const bookmarkService = {
  // ブックマーク追加
  addBookmark: async (coinId: string): Promise<BookmarkResponse> => {
    const response = await api.post('/bookmarks/', { coin_id: coinId });
    return response.data;
  },

  // ブックマーク削除
  removeBookmark: async (coinId: string): Promise<void> => {
    await api.delete(`/bookmarks/${coinId}/`);
  },

  // ユーザーのブックマーク一覧取得
  getUserBookmarks: async (): Promise<CoinListResponse> => {
    const response = await api.get('/user/bookmarks/');
    return response.data;
  },
};