import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NotFoundPage.css';

/**
 * 404 Not Found ページコンポーネント
 * 
 * 存在しないルートにアクセスした際に表示される
 */
export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">{t('notFound.title')}</h2>
        <p className="not-found-message">{t('notFound.message')}</p>
        <Link to="/" className="not-found-link">
          {t('notFound.backToHome')}
        </Link>
      </div>
    </div>
  );
};