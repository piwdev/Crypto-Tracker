import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Coin } from '../../types/crypto';
import { cryptoService } from '../../services/cryptoService';
import { tradeService } from '../../services/tradeService';
import { formatters } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import OptimizedImage from '../common/OptimizedImage';
import BookmarkButton from './BookmarkButton';
import { TradeModal } from '../trade/TradeModal';
import './CryptoDetail.css';

interface CryptoDetailProps {
  coinId: string;
}

const CryptoDetail: React.FC<CryptoDetailProps> = React.memo(({ coinId }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [coin, setCoin] = useState<Coin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [userQuantity, setUserQuantity] = useState<number>(0);

  const fetchCoinDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cryptoService.getCoinDetail(coinId);
      setCoin(response.data);
    } catch (err: any) {
      console.error('Error fetching coin detail:', err);
      if (err.response?.status === 404) {
        setError(t('crypto.coinNotFound'));
      } else if (err.response?.status >= 500) {
        setError(t('errors.serverError'));
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError(t('errors.networkError'));
      } else {
        setError(t('errors.unknownError'));
      }
    } finally {
      setLoading(false);
    }
  }, [coinId, t]);

  const fetchUserQuantity = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const portfolio = await tradeService.getPortfolio();
      const wallet = portfolio.wallets.find(w => w.coin_id === coinId);
      setUserQuantity(wallet ? parseFloat(wallet.quantity) : 0);
    } catch (err) {
      console.error('Error fetching user quantity:', err);
    }
  }, [coinId, isAuthenticated]);

  useEffect(() => {
    if (coinId) {
      fetchCoinDetail();
      fetchUserQuantity();
    }
  }, [coinId, fetchCoinDetail, fetchUserQuantity]);

  const handleBuyClick = () => {
    setTradeType('BUY');
    setTradeModalOpen(true);
  };

  const handleSellClick = () => {
    setTradeType('SELL');
    setTradeModalOpen(true);
  };

  const handleTradeComplete = () => {
    fetchUserQuantity();
  };

  const formatValue = useCallback((value: number | null | undefined, type: 'currency' | 'percentage' | 'large' | 'number' = 'number'): string => {
    if (value === null || value === undefined) {
      return t('crypto.notAvailable');
    }

    switch (type) {
      case 'currency':
        return formatters.formatCurrency(value);
      case 'percentage':
        return formatters.formatPercentage(value);
      case 'large':
        return formatters.formatLargeNumber(value);
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  }, [t]);

  const formatDate = useCallback((dateString: string | null | undefined): string => {
    if (!dateString) {
      return t('crypto.notAvailable');
    }
    return formatters.formatDateTime(dateString);
  }, [t]);

  const getChangeClass = useCallback((value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return value >= 0 ? 'crypto-detail__positive' : 'crypto-detail__negative';
  }, []);

  if (loading) {
    return (
      <div className="crypto-detail__loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="crypto-detail__error">
        <ErrorMessage
          message={error}
          showRetry
          onRetry={fetchCoinDetail}
        />
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="crypto-detail__error">
        <ErrorMessage message={t('crypto.coinNotFound')} />
      </div>
    );
  }

  return (
    <div className="crypto-detail">
      <div className="crypto-detail__header">
        <div className="crypto-detail__title">
          <OptimizedImage
            src={coin.image}
            alt={coin.name}
            className="crypto-detail__image"
            width={48}
            height={48}
            loading="eager"
          />
          <div className="crypto-detail__title-text">
            <h1 className="crypto-detail__name">{coin.name}</h1>
            <span className="crypto-detail__symbol">({coin.symbol.toUpperCase()})</span>
          </div>
        </div>
        <div className="crypto-detail__header-actions">
          <div className="crypto-detail__rank">
            #{coin.market_cap_rank || t('crypto.notAvailable')}
          </div>
          <BookmarkButton
            coinId={coin.id}
            className="crypto-detail__bookmark-button"
          />
        </div>
      </div>

      {isAuthenticated && (
        <div className="crypto-detail__trade-section">
          {userQuantity > 0 && (
            <div className="crypto-detail__holdings">
              {t('trade.yourHoldings')}: <strong>{userQuantity.toFixed(8)} {coin.symbol.toUpperCase()}</strong>
            </div>
          )}
          <div className="crypto-detail__trade-buttons">
            <button className="crypto-detail__trade-button crypto-detail__trade-button--buy" onClick={handleBuyClick}>
              {t('trade.buy')} {coin.symbol.toUpperCase()}
            </button>
            {userQuantity > 0 && (
              <button className="crypto-detail__trade-button crypto-detail__trade-button--sell" onClick={handleSellClick}>
                {t('trade.sell')} {coin.symbol.toUpperCase()}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="crypto-detail__content">
        <div className="crypto-detail__section">
          <h2 className="crypto-detail__section-title">{t('crypto.price')}</h2>
          <div className="crypto-detail__grid">
            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.currentPrice')}</span>
              <span className="crypto-detail__value crypto-detail__price">
                {formatValue(coin.current_price, 'currency')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.priceChange24h')}</span>
              <span className={`crypto-detail__value ${getChangeClass(coin.price_change_24h)}`}>
                {formatValue(coin.price_change_24h, 'currency')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.priceChangePercentage24h')}</span>
              <span className={`crypto-detail__value ${getChangeClass(coin.price_change_percentage_24h)}`}>
                {formatValue(coin.price_change_percentage_24h, 'percentage')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.high24h')}</span>
              <span className="crypto-detail__value">
                {formatValue(coin.high_24h, 'currency')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.low24h')}</span>
              <span className="crypto-detail__value">
                {formatValue(coin.low_24h, 'currency')}
              </span>
            </div>
          </div>
        </div>

        <div className="crypto-detail__section">
          <h2 className="crypto-detail__section-title">{t('crypto.marketCap')}</h2>
          <div className="crypto-detail__grid">
            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.marketCap')}</span>
              <span className="crypto-detail__value">
                {formatValue(coin.market_cap, 'large')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.fullyDilutedValuation')}</span>
              <span className="crypto-detail__value">
                {formatValue(coin.fully_diluted_valuation, 'large')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.marketCapChange24h')}</span>
              <span className={`crypto-detail__value ${getChangeClass(coin.market_cap_change_24h)}`}>
                {formatValue(coin.market_cap_change_24h, 'large')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.marketCapChangePercentage24h')}</span>
              <span className={`crypto-detail__value ${getChangeClass(coin.market_cap_change_percentage_24h)}`}>
                {formatValue(coin.market_cap_change_percentage_24h, 'percentage')}
              </span>
            </div>
          </div>
        </div>

        <div className="crypto-detail__section">
          <h2 className="crypto-detail__section-title">{t('crypto.volume')}</h2>
          <div className="crypto-detail__grid">
            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.totalVolume')}</span>
              <span className="crypto-detail__value">
                {formatValue(coin.total_volume, 'large')}
              </span>
            </div>
          </div>
        </div>

        <div className="crypto-detail__section">
          <h2 className="crypto-detail__section-title">{t('crypto.supply')}</h2>
          <div className="crypto-detail__grid">
            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.circulatingSupply')}</span>
              <span className="crypto-detail__value">
                {formatValue(coin.circulating_supply, 'large')} {coin.symbol.toUpperCase()}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.totalSupply')}</span>
              <span className="crypto-detail__value">
                {coin.total_supply ? `${formatValue(coin.total_supply, 'large')} ${coin.symbol.toUpperCase()}` : t('crypto.notAvailable')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.maxSupply')}</span>
              <span className="crypto-detail__value">
                {coin.max_supply ? `${formatValue(coin.max_supply, 'large')} ${coin.symbol.toUpperCase()}` : t('crypto.notAvailable')}
              </span>
            </div>
          </div>
        </div>

        <div className="crypto-detail__section">
          <h2 className="crypto-detail__section-title">{t('crypto.allTimeHigh')}</h2>
          <div className="crypto-detail__grid">
            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.allTimeHigh')}</span>
              <span className="crypto-detail__value">
                {formatValue(coin.ath, 'currency')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.athChangePercentage')}</span>
              <span className={`crypto-detail__value ${getChangeClass(coin.ath_change_percentage)}`}>
                {formatValue(coin.ath_change_percentage, 'percentage')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.athDate')}</span>
              <span className="crypto-detail__value">
                {formatDate(coin.ath_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="crypto-detail__section">
          <h2 className="crypto-detail__section-title">{t('crypto.allTimeLow')}</h2>
          <div className="crypto-detail__grid">
            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.allTimeLow')}</span>
              <span className="crypto-detail__value">
                {formatValue(coin.atl, 'currency')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.atlChangePercentage')}</span>
              <span className={`crypto-detail__value ${getChangeClass(coin.atl_change_percentage)}`}>
                {formatValue(coin.atl_change_percentage, 'percentage')}
              </span>
            </div>

            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.atlDate')}</span>
              <span className="crypto-detail__value">
                {formatDate(coin.atl_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="crypto-detail__section">
          <h2 className="crypto-detail__section-title">{t('common.info')}</h2>
          <div className="crypto-detail__grid">
            <div className="crypto-detail__item">
              <span className="crypto-detail__label">{t('crypto.lastUpdated')}</span>
              <span className="crypto-detail__value">
                {formatDate(coin.last_updated)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {coin && (
        <TradeModal
          isOpen={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          coinId={coin.id}
          coinName={coin.name}
          coinSymbol={coin.symbol.toUpperCase()}
          currentPrice={coin.current_price || 0}
          tradeType={tradeType}
          maxQuantity={tradeType === 'SELL' ? userQuantity : undefined}
          onTradeComplete={handleTradeComplete}
        />
      )}
    </div>
  );
});

export default CryptoDetail;