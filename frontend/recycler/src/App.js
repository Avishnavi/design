import React, { useState } from 'react';
import RecyclerDashboard from './RecyclerDashboard';
import Login from './Login';
import Register from './Register';

function App() {
  const [token, setToken] = useState(localStorage.getItem('recyclerToken'));
  const [authView, setAuthView] = useState('login');

  if (!token) {
    return (
      <div className="App">
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
      <RecyclerDashboard />
    </div>
  );
}

export default App;
