import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthRedirect コンポーネント
 * 
 * 認証済みユーザーを指定されたページにリダイレクトするコンポーネント
 * ログイン・登録ページで使用し、既にログイン済みのユーザーがアクセスした場合に
 * ホームページなどにリダイレクトする
 */
export const AuthRedirect: React.FC<AuthRedirectProps> = ({ 
  children, 
  redirectTo = '/' 
}) => {
  const { isAuthenticated, loading } = useAuth();

  // 認証状態の確認中はローディングを表示
  if (loading) {
    return <LoadingSpinner />;
  }

  // 認証済みの場合は指定されたページにリダイレクト
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // 未認証の場合は子コンポーネントを表示
  return <>{children}</>;
};