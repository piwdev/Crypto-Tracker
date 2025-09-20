import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import './i18n'; // i18n initialization
import { useAuth } from './contexts';
import { Header } from './components/common';
import { LoginPage, CreateAccountPage } from './pages';

function App() {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <div className="App">
      <Header />
      
      <main className="App-main">
        <Routes>
          <Route path="/" element={
            <div className="App-content">
              <h1>Crypto Bookmark App</h1>
              <p>Frontend project initialized successfully!</p>
              <p>Ready for component implementation.</p>
              
              {/* Authentication status display */}
              <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <h3>Authentication Status:</h3>
                {loading ? (
                  <p>Loading authentication...</p>
                ) : isAuthenticated ? (
                  <div>
                    <p>✅ Authenticated</p>
                    <p>User: {user?.username} ({user?.email})</p>
                  </div>
                ) : (
                  <p>❌ Not authenticated</p>
                )}
              </div>
            </div>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/createaccount" element={<CreateAccountPage />} />
          <Route path="/mypage" element={<div>My Page (Coming Soon)</div>} />
          <Route path="/detail/:coinId" element={<div>Crypto Detail Page (Coming Soon)</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
