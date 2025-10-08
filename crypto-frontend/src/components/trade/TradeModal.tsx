import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tradeService } from '../../services/tradeService';
import { formatters } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import './TradeModal.css';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  currentPrice: number;
  tradeType: 'BUY' | 'SELL';
  maxQuantity?: number; // For sell trades
  onTradeComplete?: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  coinId,
  coinName,
  coinSymbol,
  currentPrice,
  tradeType,
  maxQuantity,
  onTradeComplete,
}) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuantity('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const totalAmount = quantity ? (parseFloat(quantity) * currentPrice).toFixed(2) : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!quantity || parseFloat(quantity) <= 0) {
      setError(t('trade.errors.invalidQuantity'));
      return;
    }

    if (tradeType === 'SELL' && maxQuantity && parseFloat(quantity) > maxQuantity) {
      setError(t('trade.errors.insufficientQuantity'));
      return;
    }

    try {
      setLoading(true);
      const request = { coin_id: coinId, quantity };
      
      const response = tradeType === 'BUY' 
        ? await tradeService.buyTrade(request)
        : await tradeService.sellTrade(request);

      setSuccess(response.message);
      
      setTimeout(() => {
        onTradeComplete?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (maxQuantity) {
      setQuantity(maxQuantity.toString());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="trade-modal-overlay" onClick={onClose}>
      <div className="trade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trade-modal-header">
          <h2>
            {tradeType === 'BUY' ? t('trade.buy') : t('trade.sell')} {coinSymbol}
          </h2>
          <button className="trade-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="trade-modal-body">
          <div className="trade-info">
            <div className="trade-info-item">
              <span className="trade-info-label">{t('trade.coin')}:</span>
              <span className="trade-info-value">{coinName}</span>
            </div>
            <div className="trade-info-item">
              <span className="trade-info-label">{t('trade.currentPrice')}:</span>
              <span className="trade-info-value trade-info-price">{formatters.formatCurrency(currentPrice)}</span>
            </div>
            {tradeType === 'SELL' && maxQuantity !== undefined && (
              <div className="trade-info-item">
                <span className="trade-info-label">{t('trade.available')}:</span>
                <span className="trade-info-value">{maxQuantity}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="trade-form-group">
              <label htmlFor="quantity">{t('trade.quantity')}</label>
              <div className="trade-input-group">
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  step="0.00000001"
                  min="0"
                  max={maxQuantity}
                  placeholder="0.00000000"
                  disabled={loading}
                  required
                />
                {tradeType === 'SELL' && maxQuantity !== undefined && (
                  <button
                    type="button"
                    className="trade-max-button"
                    onClick={handleMaxClick}
                    disabled={loading}
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            <div className="trade-total">
              <span className="trade-total-label">
                {tradeType === 'BUY' ? t('trade.totalCost') : t('trade.totalProceeds')}:
              </span>
              <span className="trade-total-value">${parseFloat(totalAmount).toLocaleString()}</span>
            </div>

            {error && <div className="trade-error">{error}</div>}
            {success && <div className="trade-success">{success}</div>}

            <div className="trade-modal-actions">
              <button
                type="button"
                className="trade-button trade-button-cancel"
                onClick={onClose}
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className={`trade-button trade-button-${tradeType.toLowerCase()}`}
                disabled={loading}
              >
                {loading ? <LoadingSpinner /> : tradeType === 'BUY' ? t('trade.buy') : t('trade.sell')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
