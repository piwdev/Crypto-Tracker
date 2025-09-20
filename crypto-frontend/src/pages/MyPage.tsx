import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { CryptoTable } from '../components/crypto/CryptoTable';
import { bookmarkService } from '../services/bookmarkService';
import { Coin } from '../types/crypto';
import './MyPage.css';

export const MyPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [bookmarkedCoins, setBookmarkedCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await bookmarkService.getUserBookmarks();
        setBookmarkedCoins(response.data || []);
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err);
        setError(t('errors.serverError'));
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [isAuthenticated, user, t]);

  if (!isAuthenticated || !user) {
    return (
      <div className="mypage-container">
        <div className="mypage-error">
          <p>{t('errors.unauthorized')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <div className="mypage-header">
        <h1>{t('navigation.myPage')}</h1>
      </div>

      <div className="mypage-content">
        {/* User Information Section */}
        <section className="user-info-section">
          <h2>{t('user.accountInfo')}</h2>
          <div className="user-info-card">
            <div className="user-info-item">
              <label>{t('auth.email')}:</label>
              <span>{user.email}</span>
            </div>
            <div className="user-info-item">
              <label>{t('auth.username')}:</label>
              <span>{user.username}</span>
            </div>
          </div>
        </section>

        {/* Bookmarks Section */}
        <section className="bookmarks-section">
          <h2>{t('user.myBookmarks')}</h2>
          <div className="bookmarks-content">
            <CryptoTable 
              coins={bookmarkedCoins}
              loading={loading}
              error={error}
            />
          </div>
        </section>
      </div>
    </div>
  );
};