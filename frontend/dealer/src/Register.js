import React, { useState } from 'react';
import './Register.css';

const Register = ({ setToken, onSwitch }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dealerName: '',
    phone: '',
    address: '',
    area: '',
    district: '',
    storageCapacity: '',
    acceptedWasteTypes: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const wasteTypes = ['Paper', 'Plastic', 'Metal', 'Electronic', 'Glass'];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWasteToggle = (type) => {
    const updated = formData.acceptedWasteTypes.includes(type)
      ? formData.acceptedWasteTypes.filter(t => t !== type)
      : [...formData.acceptedWasteTypes, type];
    setFormData({ ...formData, acceptedWasteTypes: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`, ...)`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'scrapDealer' })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container fade-in">
      <div className="register-split">
        <div className="register-hero-side">
          <div className="logo-icon-auth" style={{ fontSize: '3rem', marginBottom: '20px' }}>📦</div>
          <h1>Join the <br/>WasteWise Network</h1>
          <p>Scale your recycling business with tools designed for modern waste logistics.</p>
          
          <div className="benefit-list">
            <div className="benefit-item">
              <div className="benefit-icon">📈</div>
              <span>Real-time inventory tracking</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🤝</div>
              <span>Direct access to industrial recyclers</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🚚</div>
              <span>Verified collector deliveries</span>
            </div>
          </div>
        </div>

        <div className="register-form-side">
          <h2>Business Registration</h2>
          <p className="subtitle">Fill in your industrial details to get started.</p>
          
          {error && <div className="error-msg">{error}</div>}
          
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Manager Name</label>
              <input type="text" name="name" placeholder="John Doe" onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Business Name (Trading As)</label>
              <input type="text" name="dealerName" placeholder="Green Scrap Solutions" onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Business Email</label>
              <input type="email" name="email" placeholder="contact@business.com" onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" placeholder="10-digit mobile" onChange={handleInputChange} required />
            </div>
            <div className="form-group full-width">
              <label>Password</label>
              <input type="password" name="password" placeholder="Min 6 characters" onChange={handleInputChange} required />
            </div>
            
            <div className="form-group">
              <label>Service Area (Layout)</label>
              <input type="text" name="area" placeholder="e.g. HSR Layout" onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>District (City)</label>
              <input type="text" name="district" placeholder="e.g. Bengaluru" onChange={handleInputChange} required />
            </div>

            <div className="form-group full-width">
              <label>Storage Capacity (kg)</label>
              <input type="number" name="storageCapacity" placeholder="e.g. 5000" onChange={handleInputChange} required />
            </div>

            <div className="form-group full-width">
              <label>Materials You Accept</label>
              <div className="waste-type-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {wasteTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleWasteToggle(type)}
                    className={`grade-badge ${formData.acceptedWasteTypes.includes(type) ? 'grade-A' : ''}`}
                    style={{ cursor: 'pointer', border: '1px solid #ddd' }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group full-width">
              <button type="submit" className="btn-primary register-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>
          
          <div className="auth-footer" style={{ marginTop: '20px' }}>
            <p>
              Already part of the network? 
              <button onClick={onSwitch} className="btn-link">Sign In</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
