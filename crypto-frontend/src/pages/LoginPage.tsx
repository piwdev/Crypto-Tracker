import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';

/**
 * ログインページコンポーネント
 * 
 * 要件:
 * - 3.1: ログインページ（URL='/login'）でemailとpasswordフィールドを持つフォームを表示
 * - 3.7: ログインページで'/createaccount'に遷移するボタンを表示
 */
export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ProtectedRouteから渡された元のパスを取得
  const from = (location.state as any)?.from?.pathname || '/';

  // 既にログイン済みの場合は元のページまたはホームページにリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // ログイン済みの場合は何も表示しない（リダイレクト中）
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="login-page">
      <LoginForm />
    </div>
  );
};