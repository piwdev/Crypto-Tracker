import api from './api';
import { BookmarkResponse, CoinListResponse } from '../types/crypto';

export const bookmarkService = {
  /**
   * ブックマーク追加
   * 要件 6.3: ユーザーがブックマークボタンをクリックした時、システムはuser_idとcoin_idでbookmarksテーブルにレコードを追加すること
   * 
   * @param coinId - ブックマークする暗号通貨のID
   * @returns Promise<BookmarkResponse> - ブックマーク作成結果
   * @throws {Error} 認証エラー、サーバーエラー、ネットワークエラーなど
   */
  addBookmark: async (coinId: string): Promise<BookmarkResponse> => {
    if (!coinId || typeof coinId !== 'string') {
      throw new Error('Invalid coin ID provided');
    }

    try {
      const response = await api.post('/bookmarks/', { coin_id: coinId });
      return response.data;
    } catch (error: any) {
      // エラーログ出力（デバッグ用）
      console.error('Failed to add bookmark:', error);
      
      // エラーを再スローして上位でハンドリングできるようにする
      throw error;
    }
  },

  /**
   * ブックマーク削除
   * 要件 6.4: ユーザーがブックマーク解除ボタンをクリックした時、システムはbookmarksテーブルから対応するレコードを削除すること
   * 
   * @param coinId - ブックマーク解除する暗号通貨のID
   * @returns Promise<void>
   * @throws {Error} 認証エラー、サーバーエラー、ネットワークエラーなど
   */
  removeBookmark: async (coinId: string): Promise<void> => {
    if (!coinId || typeof coinId !== 'string') {
      throw new Error('Invalid coin ID provided');
    }

    try {
      await api.delete(`/bookmarks/${coinId}/`);
    } catch (error: any) {
      // エラーログ出力（デバッグ用）
      console.error('Failed to remove bookmark:', error);
      
      // エラーを再スローして上位でハンドリングできるようにする
      throw error;
    }
  },

  /**
   * ユーザーのブックマーク一覧取得
   * マイページでブックマークした暗号通貨を表示するために使用
   * 
   * @returns Promise<CoinListResponse> - ユーザーのブックマーク一覧
   * @throws {Error} 認証エラー、サーバーエラー、ネットワークエラーなど
   */
  getUserBookmarks: async (): Promise<CoinListResponse> => {
    try {
      const response = await api.get('/user/bookmarks/');
      return response.data;
    } catch (error: any) {
      // エラーログ出力（デバッグ用）
      console.error('Failed to get user bookmarks:', error);
      
      // エラーを再スローして上位でハンドリングできるようにする
      throw error;
    }
  },

  /**
   * 特定のコインがブックマークされているかチェック
   * BookmarkButtonコンポーネントで使用するヘルパーメソッド
   * 
   * @param coinId - チェックする暗号通貨のID
   * @returns Promise<boolean> - ブックマークされている場合true
   */
  isBookmarked: async (coinId: string): Promise<boolean> => {
    if (!coinId || typeof coinId !== 'string') {
      return false;
    }

    try {
      const response = await bookmarkService.getUserBookmarks();
      return response.data.some(coin => coin.id === coinId);
    } catch (error: any) {
      // ブックマーク状態のチェックでエラーが発生した場合は、
      // falseを返してブックマークされていないものとして扱う
      console.error('Failed to check bookmark status:', error);
      return false;
    }
  }
};