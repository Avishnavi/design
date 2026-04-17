import React, { useState } from 'react';
import './App.css';
import './index.css';
import CollectorDashboard from './CollectorDashboard';
import { authAPI } from './api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    area: '',
    district: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Explicitly request the collector role
      const response = await authAPI.login(formData.email, formData.password, 'collector');
      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.register({ ...formData, role: 'collector' });
      alert('Registration successful! Please log in.');
      setIsRegistering(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-split-container">
        <div className="login-hero-side">
          <div className="hero-content">
            <div className="logo-icon-lg">🚛</div>
            <h1>WasteWise</h1>
            <p>Collector Operations Portal. Optimize your routes and manage pickups efficiently in one place.</p>
          </div>
        </div>
        
        <div className="login-form-side">
          <div className="login-card-compact">
            <h2>{isRegistering ? 'Collector Signup' : 'Collector Login'}</h2>
            <p className="subtitle">
              {isRegistering 
                ? 'Register your vehicle and join the WasteWise network.' 
                : 'Access your operations dashboard and manage pickups.'}
            </p>
            <form className="login-form-grid" onSubmit={isRegistering ? handleRegister : handleLogin}>
              {isRegistering && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" placeholder="e.g. Robert Smith" onChange={handleInputChange} required className="form-input-sm" />
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Email Address</label>
                  <input type="email" name="email" placeholder="collector@wastewise.com" onChange={handleInputChange} required className="form-input-sm" />
                </div>
                {isRegistering && (
                  <div className="form-group flex-1">
                    <label>Phone</label>
                    <input type="text" name="phone" placeholder="10-digit mobile" onChange={handleInputChange} required className="form-input-sm" />
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="••••••••" onChange={handleInputChange} required className="form-input-sm" />
              </div>

              {isRegistering && (
                <div className="form-group">
                  <label>Base Operations Address</label>
                  <input type="text" name="address" placeholder="Center location" onChange={handleInputChange} required className="form-input-sm" />
                </div>
              )}

              {isRegistering && (
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Area (e.g. HSR Layout)</label>
                    <input type="text" name="area" placeholder="Area" onChange={handleInputChange} required className="form-input-sm" />
                  </div>
                  <div className="form-group flex-1">
                    <label>District (e.g. Bengaluru)</label>
                    <input type="text" name="district" placeholder="District" onChange={handleInputChange} required className="form-input-sm" />
                  </div>
                </div>
              )}
              
              <button type="submit" className="btn-auth-compact" disabled={loading}>
                {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
              </button>
            </form>
            
            <div className="auth-footer-sm">
              <p>
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                <button onClick={() => setIsRegistering(!isRegistering)} className="btn-link-sm">
                  {isRegistering ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App collector-theme">
      <header className="app-header-main">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-emoji">🚛</span>
            <div className="logo-brand">
              <span className="brand-name">WasteWise</span>
              <span className="brand-module-tag">Collector Portal</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="collector-profile-brief">
            <div className="collector-avatar">
              <span className="avatar-letter">C</span>
            </div>
            <div className="collector-info">
              <span className="collector-name">Active Collector</span>
              <span className="collector-status-pill">Available</span>
            </div>
          </div>
          <button className="btn-logout-new" onClick={handleLogout}>
            <span className="logout-icon">Logout</span>
          </button>
        </div>
      </header>
      <CollectorDashboard />
    </div>
  );
}

export default App;
