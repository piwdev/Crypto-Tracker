import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CryptoTable } from '../components/crypto';
import { LoadingSpinner, ErrorMessage } from '../components/common';
import { cryptoService } from '../services/cryptoService';
import { Coin } from '../types/crypto';
import './HomePage.css';

export const HomePage: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopCryptocurrencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cryptoService.getCoinList();
      setCoins(response.data);
    } catch (err: any) {
      console.error('Error fetching cryptocurrencies:', err);
      setError(err.message || t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTopCryptocurrencies();
  }, [fetchTopCryptocurrencies]);

  const pageHeader = useMemo(() => (
    <div className="home-page-header">
      <h1>{t('crypto.topCryptocurrencies')}</h1>
      <p className="home-page-description">
        {t('navigation.home')} - {t('crypto.topCryptocurrencies')}
      </p>
    </div>
  ), [t]);

  if (loading) {
    return (
      <div className="home-page">
        {pageHeader}
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        {pageHeader}
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="home-page">
      {pageHeader}
      
      <div className="home-page-content">
        <CryptoTable 
          coins={coins} 
          loading={loading} 
          error={error} 
        />
      </div>
    </div>
  );
});