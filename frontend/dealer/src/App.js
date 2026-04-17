import React, { useState, useEffect } from 'react';
import DealerDashboard from './DealerDashboard';
import Login from './Login';
import Register from './Register';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  if (!token) {
    return (
      <div className="App auth-theme">
        {authView === 'login' ? (
          <Login setToken={setToken} onSwitch={() => setAuthView('register')} />
        ) : (
          <Register setToken={setToken} onSwitch={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <DealerDashboard />
    </div>
  );
}

export default App;
