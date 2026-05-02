import React, { useState } from 'react';
import './Register.css';

const Register = ({ setToken, onSwitch }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    address: '',
    area: '',
    district: '',
    maxPurchaseCapacity: '',
    acceptedMaterials: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const materials = ['Paper', 'Plastic', 'Metal', 'Electronic', 'Glass', 'Mixed'];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMaterialToggle = (type) => {
    const updated = formData.acceptedMaterials.includes(type)
      ? formData.acceptedMaterials.filter(t => t !== type)
      : [...formData.acceptedMaterials, type];
    setFormData({ ...formData, acceptedMaterials: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'recycler' })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('recyclerToken', data.token);
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
          <div className="logo-icon-auth" style={{ fontSize: '3rem', marginBottom: '20px' }}>🏭</div>
          <h1>Join the <br/>WasteWise Recyclers</h1>
          <p>Access high-quality industrial bulk scrap delivered directly to your processing center.</p>
          
          <div className="benefit-list">
            <div className="benefit-item">
              <div className="benefit-icon">📈</div>
              <span>Volume & Logistics Forecasting</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🤝</div>
              <span>Trusted Dealer Network</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🚚</div>
              <span>Quality Control Transparency</span>
            </div>
          </div>
        </div>

        <div className="register-form-side">
          <h2>Factory Registration</h2>
          <p className="subtitle">Fill in your recycling center details to get started.</p>
          
          {error && <div className="error-msg">{error}</div>}
          
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Operations Manager</label>
              <input type="text" name="name" placeholder="John Doe" onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" name="companyName" placeholder="Eco Processors Ltd." onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Business Email</label>
              <input type="email" name="email" placeholder="contact@ecofactory.com" onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" placeholder="10-digit mobile" onChange={handleInputChange} required />
            </div>
            <div className="form-group full-width">
              <label>Password</label>
              <input type="password" name="password" placeholder="Min 6 characters" onChange={handleInputChange} required />
            </div>
            
            <div className="form-group full-width">
              <label>Full Facility Address</label>
              <input type="text" name="address" placeholder="123 Industrial Area Rd." onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Service Area (Layout)</label>
              <input type="text" name="area" placeholder="e.g. Peenya" onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>District (City)</label>
              <input type="text" name="district" placeholder="e.g. Bengaluru" onChange={handleInputChange} required />
            </div>

            <div className="form-group full-width">
              <label>Max Monthly Purchase Capacity (kg)</label>
              <input type="number" name="maxPurchaseCapacity" placeholder="e.g. 50000" onChange={handleInputChange} required />
            </div>

            <div className="form-group full-width">
              <label>Materials You Process</label>
              <div className="waste-type-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {materials.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleMaterialToggle(type)}
                    className={`grade-badge ${formData.acceptedMaterials.includes(type) ? 'grade-A' : ''}`}
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
              Already an operational factory? 
              <button onClick={onSwitch} className="btn-link">Sign In</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
