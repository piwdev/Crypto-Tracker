import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CryptoTable } from '../components/crypto';
import { LoadingSpinner, ErrorMessage } from '../components/common';
import { cryptoService } from '../services/cryptoService';
import { Coin } from '../types/crypto';
import './ListPage.css';

export const ListPage: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [lastupdatetime, setLastupdatetime] = useState<string>('-');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWholeCryptocurrencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [response, lastupdate_response] = await Promise.all([
        cryptoService.getCoinWholeList(),
        cryptoService.getCoinDetail('bitcoin')
      ]);
      setCoins(response.data);
      // get last update time
      const d = lastupdate_response.data.updated_at;
      setLastupdatetime(`${d.substring(0, 10)} ${d.substring(11, 19)} ${d.substring(26, 32)}`);
    } catch (err: any) {
      console.error('Error fetching cryptocurrencies:', err);
      setError(err.message || t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchWholeCryptocurrencies();
  }, [fetchWholeCryptocurrencies]);

  const pageHeader = useMemo(() => (
    <div className="list-page-header">
      <h1>{t('crypto.cryptoList')}</h1>
      <p className="list-page-description">
        {t('navigation.list')}
      </p>
      <p>{t('crypto.lastUpdated')} {lastupdatetime} </p>
      <p className="list-page-description">{t('crypto.refreshInterval')}</p>
    </div>
  ), [t, lastupdatetime]);

  if (loading) {
    return (
      <div className="list-page">
        {pageHeader}
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="list-page">
        {pageHeader}
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="list-page">
      {pageHeader}

      <div className="list-page-content">
        <CryptoTable
          coins={coins}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
});