import React, { useState } from 'react';
import './Login.css';

const Login = ({ setToken, onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'scrapDealer' })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="login-split">
        <div className="login-hero-side">
          <div className="hero-content">
            <div className="logo-icon-auth" style={{ fontSize: '3rem', marginBottom: '20px' }}>🏢</div>
            <h1>WasteWise <br/>for Dealers</h1>
            <p>Manage inventory, verify collections from collectors, and sell to recyclers with our intelligent matching engine.</p>
          </div>
        </div>
        
        <div className="login-form-side">
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to your dealer dashboard.</p>
          
          {error && <div className="error-msg">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="dealer@wastewise.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Login to Dashboard'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              Don't have an account? 
              <button onClick={onSwitch} className="btn-link">Register Business</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
