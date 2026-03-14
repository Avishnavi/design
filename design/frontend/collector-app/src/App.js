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
    address: ''
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
      <div className="login-screen">
        <div className="login-header">
          <div className="logo-icon">🚛</div>
          <h1>WasteWise</h1>
          <p>Collector Operations Portal</p>
        </div>

        <div className="login-card">
          <h2>{isRegistering ? 'Collector Signup' : 'Collector Login'}</h2>
          <form className="login-form" onSubmit={isRegistering ? handleRegister : handleLogin}>
            {isRegistering && (
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" name="name" placeholder="e.g. Robert Smith" 
                  onChange={handleInputChange} required className="form-input"
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" name="email" placeholder="collector@wastewise.com" 
                onChange={handleInputChange} required className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" name="password" placeholder="••••••••" 
                onChange={handleInputChange} required className="form-input"
              />
            </div>

            {isRegistering && (
              <>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" name="phone" placeholder="10-digit mobile" 
                    onChange={handleInputChange} required className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Base Operations Address</label>
                  <input 
                    type="text" name="address" placeholder="Center location" 
                    onChange={handleInputChange} required className="form-input"
                  />
                </div>
              </>
            )}
            
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              <button onClick={() => setIsRegistering(!isRegistering)} className="btn-link">
                {isRegistering ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App collector-theme">
      <header className="app-top-bar">
        <div className="logo-text">♻️ WasteWise <span className="role-badge">Collector Portal</span></div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>
      <CollectorDashboard />
    </div>
  );
}

export default App;
