import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { CryptoTable } from '../components/crypto/CryptoTable';
import { bookmarkService } from '../services/bookmarkService';
import { tradeService } from '../services/tradeService';
import { Coin } from '../types/crypto';
import { Portfolio, TradeHistoryItem } from '../types/trade';
import Pagination from '../components/common/Pagination';
import './MyPage.css';

export const MyPage: React.FC = React.memo(() => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [bookmarkedCoins, setBookmarkedCoins] = useState<Coin[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
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
  }, [isAuthenticated, user, t]);

  const fetchPortfolio = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPortfolioLoading(false);
      return;
    }

    try {
      setPortfolioLoading(true);
      const data = await tradeService.getPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    } finally {
      setPortfolioLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchTradeHistory = useCallback(async (page: number = 1) => {
    if (!isAuthenticated || !user) {
      setHistoryLoading(false);
      return;
    }

    try {
      setHistoryLoading(true);
      const data = await tradeService.getTradeHistory(page, itemsPerPage);
      setTradeHistory(data.data);
      setTotalItems(data.count);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch trade history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated, user, itemsPerPage]);

  useEffect(() => {
    fetchBookmarks();
    fetchPortfolio();
    fetchTradeHistory();
  }, [fetchBookmarks, fetchPortfolio, fetchTradeHistory]);

  // Format date according to current language
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const locale = i18n.language === 'ja' ? 'ja-JP' : 'en-US';

    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [i18n.language]);

  const userInfoSection = useMemo(() => {
    if (!user) return null;

    return (
      <section className="user-info-section">
        <h2>{t('user.accountInfo')}</h2>
        <div className="user-info-card">
          <div className="user-info-item">
            <label>{t('auth.email')}:</label>
            <span>{user.email}</span>
          </div>
          <div className="user-info-item">
            <label>{t('auth.username')}:</label>
            <span>{user.name}</span>
          </div>
        </div>
      </section>
    );
  }, [user, t]);

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
        {userInfoSection}

        {/* Portfolio Section */}
        <section className="portfolio-section">
          <h2>{t('trade.portfolio')}</h2>
          {portfolioLoading ? (
            <div className="portfolio-loading">{t('common.loading')}</div>
          ) : portfolio ? (
            <div className="portfolio-content">
              <div className="portfolio-summary">
                <div className="portfolio-card">
                  <div className="portfolio-card-label">{t('trade.bankBalance')}</div>
                  <div className="portfolio-card-value">${parseFloat(portfolio.bank_balance).toLocaleString()}</div>
                </div>
                <div className="portfolio-card">
                  <div className="portfolio-card-label">{t('trade.portfolioValue')}</div>
                  <div className="portfolio-card-value">${parseFloat(portfolio.total_portfolio_value).toLocaleString()}</div>
                </div>
                <div className="portfolio-card portfolio-card-total">
                  <div className="portfolio-card-label">{t('trade.totalAssets')}</div>
                  <div className="portfolio-card-value">${parseFloat(portfolio.total_assets).toLocaleString()}</div>
                </div>
              </div>

              {portfolio.wallets.length > 0 ? (
                <div className="wallet-table-container">
                  <table className="wallet-table">
                    <thead>
                      <tr>
                        <th>{t('trade.coin')}</th>
                        <th>{t('trade.quantity')}</th>
                        <th>{t('trade.currentPrice')}</th>
                        <th>{t('trade.currentValue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.wallets.map((wallet) => (
                        <tr key={wallet.coin_id}>
                          <td>
                            <div className="wallet-coin-info">
                              <img src={wallet.coin_image} alt={wallet.coin_name} className="wallet-coin-image" />
                              <div>
                                <div className="wallet-coin-name">{wallet.coin_name}</div>
                                <div className="wallet-coin-symbol">{wallet.coin_symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td>{parseFloat(wallet.quantity).toFixed(8)}</td>
                          <td>${parseFloat(wallet.current_price).toLocaleString()}</td>
                          <td className="wallet-value">${parseFloat(wallet.current_value).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="portfolio-empty">{t('trade.noHoldings')}</div>
              )}
            </div>
          ) : (
            <div className="portfolio-error">{t('errors.serverError')}</div>
          )}
        </section>

        {/* Trade History Section */}
        <section className="trade-history-section">
          <h2>{t('trade.tradeHistory')}</h2>
          {historyLoading ? (
            <div className="history-loading">{t('common.loading')}</div>
          ) : tradeHistory.length > 0 ? (
            <>
              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>{t('trade.date')}</th>
                      <th>{t('trade.type')}</th>
                      <th>{t('trade.coin')}</th>
                      <th>{t('trade.quantity')}</th>
                      <th>{t('trade.price')}</th>
                      <th>{t('trade.balanceAfter')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistory.map((trade) => (
                      <tr key={trade.id}>
                        <td>{formatDate(trade.created_at)}</td>
                        <td>
                          <span className={`trade-type trade-type-${trade.trade_type.toLowerCase()}`}>
                            {trade.trade_type === 'BUY' ? t('trade.buy') : t('trade.sell')}
                          </span>
                        </td>
                        <td>
                          <div className="history-coin-info">
                            <div className="history-coin-name">{trade.coin_name}</div>
                            <div className="history-coin-symbol">{trade.coin_symbol}</div>
                          </div>
                        </td>
                        <td>{parseFloat(trade.trade_quantity).toFixed(8)}</td>
                        <td>${parseFloat(trade.trade_price_per_coin).toLocaleString()}</td>
                        <td>${parseFloat(trade.balance_after_trade).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalItems > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={fetchTradeHistory}
                />
              )}
            </>
          ) : (
            <div className="history-empty">{t('trade.noTrades')}</div>
          )}
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
});