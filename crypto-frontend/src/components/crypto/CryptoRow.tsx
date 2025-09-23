import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coin } from '../../types/crypto';
import { formatters } from '../../utils/formatters';
import OptimizedImage from '../common/OptimizedImage';
import BookmarkButton from './BookmarkButton';
import './CryptoRow.css';

interface CryptoRowProps {
  coin: Coin;
  onClick?: (coinId: string) => void;
  showBookmarkButton?: boolean;
}

export const CryptoRow: React.FC<CryptoRowProps> = React.memo(({ coin, onClick, showBookmarkButton = false }) => {
  const navigate = useNavigate();

  const handleRowClick = useCallback((event: React.MouseEvent) => {
    // Prevent row click when clicking on bookmark button
    if ((event.target as HTMLElement).closest('.bookmark-button-container')) {
      return;
    }

    if (onClick) {
      onClick(coin.id);
    } else {
      navigate(`/detail/${coin.id}`);
    }
  }, [coin.id, onClick, navigate]);



  return (
    <tr 
      className="crypto-row"
      onClick={handleRowClick}
    >
      <td className="crypto-rank">
        {coin.market_cap_rank || 'N/A'}
      </td>
      <td className="crypto-name">
        <div className="crypto-name-container">
          <OptimizedImage
            src={coin.image || ''} 
            alt={coin.name || 'Cryptocurrency'}
            className="crypto-image"
            width={24}
            height={24}
            loading="lazy"
          />
          <div className="crypto-name-text">
            <span className="crypto-name-full">{coin.name || 'Unknown'}</span>
            <span className="crypto-symbol">{coin.symbol?.toUpperCase() || 'N/A'}</span>
          </div>
        </div>
      </td>
      <td className="crypto-price">
        {formatters.formatCurrency(coin.current_price || 0)}
      </td>
      <td className="crypto-high">
        {formatters.formatCurrency(coin.high_24h || 0)}
      </td>
      <td className={`crypto-change ${(coin.price_change_percentage_24h || 0) >= 0 ? 'positive' : 'negative'}`}>
        {formatters.formatPercentage(coin.price_change_percentage_24h || 0)}
      </td>
      <td className="crypto-market-cap">
        {formatters.formatLargeNumber(coin.market_cap || 0)}
      </td>
      {showBookmarkButton && (
        <td className="crypto-bookmark">
          <BookmarkButton 
            coinId={coin.id}
            className="crypto-row-bookmark"
          />
        </td>
      )}
    </tr>
  );
});