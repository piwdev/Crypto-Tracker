import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CryptoTable } from '../components/crypto';
import { LoadingSpinner, ErrorMessage } from '../components/common';
import { cryptoService } from '../services/cryptoService';
import { Coin } from '../types/crypto';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopCryptocurrencies = async () => {
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
    };

    fetchTopCryptocurrencies();
  }, [t]);

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-page-header">
          <h1>{t('crypto.topCryptocurrencies')}</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="home-page-header">
          <h1>{t('crypto.topCryptocurrencies')}</h1>
        </div>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-page-header">
        <h1>{t('crypto.topCryptocurrencies')}</h1>
        <p className="home-page-description">
          {t('navigation.home')} - {t('crypto.topCryptocurrencies')}
        </p>
      </div>
      
      <div className="home-page-content">
        <CryptoTable 
          coins={coins} 
          loading={loading} 
          error={error} 
        />
      </div>
    </div>
  );
};