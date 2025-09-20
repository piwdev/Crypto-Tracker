import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import './i18n'; // i18n initialization

import { Header } from './components/common';
import { HomePage, LoginPage, CreateAccountPage, DetailPage, MyPage } from './pages';

function App() {

  return (
    <div className="App">
      <Header />
      
      <main className="App-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/createaccount" element={<CreateAccountPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/detail/:coinId" element={<DetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
