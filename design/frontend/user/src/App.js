import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import PickupWizard from './components/PickupWizard';
import BottomNav from './components/BottomNav';
import PickupTracking from './components/PickupTracking';
import UserProfile from './components/UserProfile';
import PickupHistory from './components/PickupHistory';
import TrackingCenter from './components/TrackingCenter';
import { userAPI } from './api';
import axios from 'axios'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWizard, setShowWizard] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', address: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await userAPI.getProfile();
      setUser(res.data.data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await userAPI.getHistory();
      setHistory(res.data.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
      fetchHistory();
      const interval = setInterval(fetchHistory, 20000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchProfile, fetchHistory]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = `http://localhost:5000/api/auth/${isRegistering ? 'register' : 'login'}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'user' })
      });
      const data = await res.json();
      if (res.ok) {
        if (isRegistering) {
          alert('Registration successful! Please login.');
          setIsRegistering(false);
        } else {
          localStorage.setItem('token', data.token);
          setIsLoggedIn(true);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const latestPickup = history[0];

  const handleTrackPickup = (pickup) => {
    setSelectedPickup(pickup);
    setActiveTab('tracking');
  };

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <div className="login-header">
          <div className="logo-icon">♻️</div>
          <h1>WasteWise</h1>
          <p>Join the circular economy</p>
        </div>
        
        <div className="login-card">
          <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
          <form className="login-form" onSubmit={handleAuth}>
            {isRegistering && (
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  className="form-input" 
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="email@example.com" 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
                className="form-input" 
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required 
                className="form-input" 
              />
            </div>

            {isRegistering && (
              <>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="10-digit number" 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    required 
                    className="form-input" 
                  />
                </div>
                <div className="form-group">
                  <label>Service Address</label>
                  <input 
                    type="text" 
                    placeholder="Your primary address" 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    required 
                    className="form-input" 
                  />
                </div>
              </>
            )}
            
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Login')}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              <button className="btn-link" onClick={() => setIsRegistering(!isRegistering)}>
                {isRegistering ? 'Login' : 'Create one'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App user-theme">
      <header className="app-top-bar">
        <div className="logo-text">♻️ WasteWise</div>
        <button className="btn-logout-sm" onClick={() => { localStorage.removeItem('token'); setIsLoggedIn(false); }}>Logout</button>
      </header>

      {!showWizard ? (
        <>
          {activeTab === 'dashboard' && (
            <div className="dashboard-wrapper">
              {latestPickup?.status === 'Pending' && (
                <div className="status-banner searching">
                  <span className="loader"></span>
                  <p>Searching for collector near you...</p>
                </div>
              )}
              <Dashboard 
                user={user}
                history={history}
                onRequestPickup={() => setShowWizard(true)} 
                onTrackPickup={handleTrackPickup}
                onViewHistory={() => setActiveTab('history')}
              />
            </div>
          )}
          {activeTab === 'tracking' && (
            <TrackingCenter 
              history={history} 
              initialPickup={selectedPickup} 
            />
          )}
          {activeTab === 'history' && (
            <PickupHistory history={history} onTrack={handleTrackPickup} />
          )}
          {activeTab === 'profile' && (
            <UserProfile 
              user={user} 
              history={history} 
              onUpdate={fetchProfile} 
            />
          )}
          <BottomNav activeTab={activeTab} onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'tracking') setSelectedPickup(null);
          }} />
        </>
      ) : (
        <PickupWizard 
          onComplete={() => { setShowWizard(false); fetchHistory(); }} 
          onCancel={() => setShowWizard(false)} 
        />
      )}
    </div>
  );
}

export default App;
