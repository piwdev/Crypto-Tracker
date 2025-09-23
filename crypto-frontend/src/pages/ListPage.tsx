import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CryptoTable } from '../components/crypto';
import { LoadingSpinner, ErrorMessage, Pagination } from '../components/common';
import { cryptoService } from '../services/cryptoService';
import { Coin } from '../types/crypto';
import { calculatePageIndices } from '../utils/pagination';
import { useAuth } from '../contexts/AuthContext';
import './ListPage.css';

export const ListPage: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [lastupdatetime, setLastupdatetime] = useState<string>('-');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20; // Default items per page as per requirement 1.1

  const fetchWholeCryptocurrencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [response, lastupdate_response] = await Promise.all([
        cryptoService.getCoinWholeList(),
        cryptoService.getCoinDetail('bitcoin')
      ]);
      setCoins(response.data);
      // Reset to first page when data is refreshed (requirement 3.4)
      setCurrentPage(1);
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

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const { startIndex, endIndex } = calculatePageIndices(currentPage, itemsPerPage);
    return coins.slice(startIndex, endIndex);
  }, [coins, currentPage, itemsPerPage]);

  // Page change handler with scroll-to-top functionality (requirement 4.4)
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of the page for better user experience
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
          coins={paginatedData}
          loading={loading}
          error={error}
          showBookmarkButtons={isAuthenticated ? true : false}
        />
        
        {/* Pagination component - only show when there are coins and no error */}
        {!loading && !error && coins.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={coins.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            className="list-page-pagination"
          />
        )}
      </div>
    </div>
  );
});