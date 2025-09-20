import React from 'react';
import { useTranslation } from 'react-i18next';
import { Coin } from '../../types/crypto';
import { CryptoRow } from './CryptoRow';
import './CryptoTable.css';

interface CryptoTableProps {
  coins: Coin[];
  loading?: boolean;
  error?: string | null;
}

export const CryptoTable: React.FC<CryptoTableProps> = ({ 
  coins, 
  loading = false, 
  error = null 
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="crypto-table-loading">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crypto-table-error">
        <p>{t('common.error')}: {error}</p>
      </div>
    );
  }

  if (coins.length === 0) {
    return (
      <div className="crypto-table-empty">
        <p>{t('crypto.noBookmarks')}</p>
      </div>
    );
  }

  return (
    <div className="crypto-table-container">
      <table className="crypto-table">
        <thead>
          <tr>
            <th>{t('crypto.rank')}</th>
            <th>{t('crypto.name')}</th>
            <th>{t('crypto.price')}</th>
            <th>{t('crypto.high24h')}</th>
            <th>{t('crypto.change24h')}</th>
            <th>{t('crypto.marketCap')}</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <CryptoRow key={coin.id} coin={coin} />
          ))}
        </tbody>
      </table>
    </div>
  );
};