import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/responsive-utils.css'; // Responsive utilities
import './i18n'; // i18n initialization

import { Header, ProtectedRoute, AuthRedirect } from './components/common';
import { HomePage, LoginPage, CreateAccountPage, DetailPage, MyPage, NotFoundPage } from './pages';

function App() {

  return (
    <div className="App">
      <Header />
      
      <main className="App-main">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/detail/:coinId" element={<DetailPage />} />
          
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
    </div>
  );
}

export default App;
