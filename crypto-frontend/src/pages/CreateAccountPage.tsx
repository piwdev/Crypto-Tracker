import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreateAccountForm } from '../components/auth/CreateAccountForm';

/**
 * アカウント作成ページコンポーネント
 * 
 * 要件:
 * - 2.1: アカウント作成ページ（URL='/createaccount'）でemail、password、nameフィールドを持つフォームを表示
 * - 2.2: emailが適切なメール形式であることを検証
 * - 2.3: passwordがアルファベットと数字のみで構成され、4-20文字であることを検証
 * - 2.4: nameがアルファベットまたは日本語文字のみで構成され、1-20文字であることを検証
 * - 2.5: emailが既に存在する場合、「既に登録されているメールアドレスです」を表示
 */
export const CreateAccountPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 既にログイン済みの場合はホームページにリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // ログイン済みの場合は何も表示しない（リダイレクト中）
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="create-account-page">
      <CreateAccountForm />
    </div>
  );
};