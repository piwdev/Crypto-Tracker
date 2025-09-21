import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from './';
import './Header.css';

const Header: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, navigate]);

  return (
    <header className="header">
      <div className="header__container">
        {/* Logo/Brand */}
        <div className="header__brand">
          <Link to="/" className="header__brand-link">
            <h1 className="header__title">CryptoTracker</h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="header__nav">
          <ul className="header__nav-list">
            <li className="header__nav-item">
              <Link to="/" className="header__nav-link">
                {t('navigation.home')}
              </Link>
            </li>

            {/* Authenticated user navigation */}
            {isAuthenticated && (
              <li className="header__nav-item">
                <Link to="/mypage" className="header__nav-link">
                  {t('navigation.myPage')}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Right side controls */}
        <div className="header__controls">
          {/* Language Selector */}
          <div className="header__language">
            <LanguageSelector />
          </div>

          {/* Authentication buttons */}
          <div className="header__auth">
            {isAuthenticated ? (
              <div className="header__user-section">
                <span className="header__user-name">
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="header__auth-button header__auth-button--logout"
                  type="button"
                >
                  {t('navigation.logout')}
                </button>
              </div>
            ) : (
              <div className="header__guest-section">
                <Link
                  to="/login"
                  className="header__auth-button header__auth-button--login"
                >
                  {t('navigation.login')}
                </Link>
                <Link
                  to="/createaccount"
                  className="header__auth-button header__auth-button--register"
                >
                  {t('navigation.createAccount')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>this site's data is from https://www.coingecko.com</div>
    </header>
  );
});

export default Header;