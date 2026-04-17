import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setToken, onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password, 
        role: 'recycler' 
      });
      if (res.data.success) {
        localStorage.setItem('recyclerToken', res.data.token);
        setToken(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="register-container fade-in">
      <div className="register-split" style={{ minHeight: '600px', maxWidth: '900px' }}>
        <div className="register-hero-side" style={{ display: 'flex' }}>
          <div className="logo-icon-auth" style={{ fontSize: '3rem', marginBottom: '20px' }}>🏭</div>
          <h1>Recycler Portal</h1>
          <p>Access your factory dashboard to procure scrap and manage your processing queues.</p>
        </div>

        <div className="register-form-side" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2>Sign In</h2>
          <p className="subtitle">Welcome back to WasteWise!</p>
          
          <form onSubmit={handleLogin} className="form-grid" style={{ display: 'flex', flexDirection: 'column' }}>
            {error && <div style={{ color: 'red', marginBottom: '10px', background: '#ffe4e6', padding: '10px', borderRadius: '5px' }}>{error}</div>}
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>Business Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            
            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '15px', fontSize: '1.1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: '30px', textAlign: 'center' }}>
            <p>
               Don't have a factory account? 
              <button onClick={onSwitch} className="btn-link" style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}>Register Facility</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
