import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coin } from '../../types/crypto';
import { formatters } from '../../utils/formatters';
import './CryptoRow.css';

interface CryptoRowProps {
  coin: Coin;
  onClick?: (coinId: string) => void;
}

export const CryptoRow: React.FC<CryptoRowProps> = ({ coin, onClick }) => {
  const navigate = useNavigate();

  const handleRowClick = () => {
    if (onClick) {
      onClick(coin.id);
    } else {
      navigate(`/detail/${coin.id}`);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  return (
    <tr 
      className="crypto-row"
      onClick={handleRowClick}
    >
      <td className="crypto-rank">
        {coin.market_cap_rank}
      </td>
      <td className="crypto-name">
        <div className="crypto-name-container">
          <img 
            src={coin.image} 
            alt={coin.name}
            className="crypto-image"
            onError={handleImageError}
          />
          <div className="crypto-name-text">
            <span className="crypto-name-full">{coin.name}</span>
            <span className="crypto-symbol">{coin.symbol.toUpperCase()}</span>
          </div>
        </div>
      </td>
      <td className="crypto-price">
        {formatters.formatCurrency(coin.current_price)}
      </td>
      <td className="crypto-high">
        {formatters.formatCurrency(coin.high_24h)}
      </td>
      <td className={`crypto-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
        {formatters.formatPercentage(coin.price_change_percentage_24h)}
      </td>
      <td className="crypto-market-cap">
        {formatters.formatLargeNumber(coin.market_cap)}
      </td>
    </tr>
  );
};