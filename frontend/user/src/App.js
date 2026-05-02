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
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', address: '', area: '', district: '' });

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
      
      // Dynamic interval: 10s if pending, 60s otherwise to save resources
      const intervalTime = history.some(p => p.status === 'Pending') ? 10000 : 60000;
      const interval = setInterval(fetchHistory, intervalTime);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchProfile, fetchHistory, history]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/${isRegistering ? 'register' : 'login'}`;
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
      <div className="login-split-container">
        <div className="login-hero-side">
          <div className="hero-content">
            <div className="logo-icon-lg">♻️</div>
            <h1>WasteWise</h1>
            <p>Join the circular economy. Manage your waste smarter, faster, and greener.</p>
          </div>
        </div>
        
        <div className="login-form-side">
          <div className="login-card-compact">
            <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
            
            <form className="login-form-grid" onSubmit={handleAuth}>
              {isRegistering && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="John Doe" onChange={e => setFormData({...formData, name: e.target.value})} required className="form-input-sm" />
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Email</label>
                  <input type="email" placeholder="email@example.com" onChange={e => setFormData({...formData, email: e.target.value})} required className="form-input-sm" />
                </div>
                {isRegistering && (
                  <div className="form-group flex-1">
                    <label>Phone</label>
                    <input type="text" placeholder="10-digit #" onChange={e => setFormData({...formData, phone: e.target.value})} required className="form-input-sm" />
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" onChange={e => setFormData({...formData, password: e.target.value})} required className="form-input-sm" />
              </div>

              {isRegistering && (
                <div className="form-group">
                  <label>Service Address</label>
                  <input type="text" placeholder="Your primary address" onChange={e => setFormData({...formData, address: e.target.value})} required className="form-input-sm" />
                </div>
              )}

              {isRegistering && (
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Area (e.g. HSR Layout)</label>
                    <input type="text" placeholder="Area" onChange={e => setFormData({...formData, area: e.target.value})} required className="form-input-sm" />
                  </div>
                  <div className="form-group flex-1">
                    <label>District (e.g. Bengaluru)</label>
                    <input type="text" placeholder="District" onChange={e => setFormData({...formData, district: e.target.value})} required className="form-input-sm" />
                  </div>
                </div>
              )}
              
              <button type="submit" className="btn-auth-compact" disabled={loading}>
                {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Login')}
              </button>
            </form>
            
            <div className="auth-footer-sm">
              <p>
                {isRegistering ? 'Have an account?' : "New here?"}
                <button className="btn-link-sm" onClick={() => setIsRegistering(!isRegistering)}>
                  {isRegistering ? 'Login' : 'Create one'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App user-theme">
      <header className="app-header-main">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-emoji">♻️</span>
            <div className="logo-brand">
              <span className="brand-name">WasteWise</span>
              <span className="brand-module-tag">User Portal</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          {user && (
            <div className="user-profile-brief">
              <div className="user-avatar">
                <span className="avatar-letter">{user.name?.charAt(0) || 'U'}</span>
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-eco-rank">Eco Citizen</span>
              </div>
            </div>
          )}
          <button className="btn-logout-new" onClick={() => { localStorage.removeItem('token'); setIsLoggedIn(false); }}>
            Logout
          </button>
        </div>
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
          user={user}
          onComplete={() => { setShowWizard(false); fetchHistory(); }} 
          onCancel={() => setShowWizard(false)} 
        />
      )}
    </div>
  );
}

export default App;
