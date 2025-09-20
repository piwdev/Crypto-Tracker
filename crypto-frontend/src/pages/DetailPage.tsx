import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import CryptoDetail from '../components/crypto/CryptoDetail';

export const DetailPage: React.FC = () => {
  const { coinId } = useParams<{ coinId: string }>();

  // If no coinId is provided, redirect to home
  if (!coinId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="detail-page">
      <CryptoDetail coinId={coinId} />
    </div>
  );
};