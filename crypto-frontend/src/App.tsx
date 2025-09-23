import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/responsive-utils.css'; // Responsive utilities
import './i18n'; // i18n initialization

import { ErrorProvider } from './contexts/ErrorContext';
import { 
  Header, 
  Footer,
  ProtectedRoute, 
  AuthRedirect, 
  ErrorBoundary, 
  GlobalErrorNotification,
  NetworkStatus 
} from './components/common';
import { HomePage, LoginPage, CreateAccountPage, DetailPage, ListPage, MyPage, NotFoundPage } from './pages';

function App() {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <div className="App">
          <NetworkStatus />
          <GlobalErrorNotification />
          <Header />
          
          <main className="App-main">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/detail/:coinId" element={<DetailPage />} />
              <Route path="/list" element={<ListPage />} />

              {/* Auth routes - redirect authenticated users */}
              <Route path="/login" element={
                <AuthRedirect>
                  <LoginPage />
                </AuthRedirect>
              } />
              <Route path="/createaccount" element={
                <AuthRedirect>
                  <CreateAccountPage />
                </AuthRedirect>
              } />
              
              {/* Protected routes - require authentication */}
              <Route path="/mypage" element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              } />
              
              {/* 404 Not Found */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </ErrorBoundary>
    </ErrorProvider>
  );
}

export default App;
