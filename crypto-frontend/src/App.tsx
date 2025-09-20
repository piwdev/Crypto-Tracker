import React from 'react';
import './App.css';
import './i18n'; // i18n initialization
import { useAuth } from './contexts';

function App() {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <div className="App">
      <header className="App-header">
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
      </header>
    </div>
  );
}

export default App;
