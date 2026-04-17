import React, { useState } from 'react';
import './UserProfile.css';
import { userAPI } from '../api';

const UserProfile = ({ user, history, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    area: user?.area || '',
    district: user?.district || ''
  });
  const [loading, setLoading] = useState(false);

  const totalRecycled = history
    .filter(p => p.status === 'Recycled' || p.status === 'SentToDealer')
    .reduce((sum, p) => sum + p.quantity, 0);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userAPI.updateProfile(formData);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-profile container">
      <div className="profile-hero card">
        <div className="profile-avatar-large">
          {user?.name?.charAt(0)}
          <div className="online-indicator"></div>
        </div>
        <div className="profile-titles">
          <h2>{user?.name}</h2>
          <p className="profile-email">{user?.email}</p>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="p-stat-card card">
          <span className="p-stat-val">{history.length}</span>
          <span className="p-stat-label">Requests</span>
        </div>
        <div className="p-stat-card card">
          <span className="p-stat-val">{totalRecycled}kg</span>
          <span className="p-stat-label">Impact</span>
        </div>
        <div className="p-stat-card card">
          <span className="p-stat-val">₹{totalRecycled * 15}</span>
          <span className="p-stat-label">Saved</span>
        </div>
      </div>

      <div className="profile-details-section card">
        <div className="section-header">
          <h3>Personal Details</h3>
          <button 
            className="btn-edit-toggle"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <form className="edit-profile-form" onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Default Address</label>
              <textarea 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                required
              ></textarea>
            </div>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Area (e.g. HSR Layout)</label>
                <input 
                  type="text" 
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: e.target.value})}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>District (e.g. Bengaluru)</label>
                <input 
                  type="text" 
                  value={formData.district}
                  onChange={e => setFormData({...formData, district: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-save-profile" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div className="details-list">
            <div className="detail-item">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{user?.phone}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Address</span>
              <span className="detail-value">
                {user?.address}<br/>
                <span className="location-tag">{user?.area}, {user?.district}</span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Member Since</span>
              <span className="detail-value">{new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      <button className="btn-logout-full" onClick={() => {
        localStorage.removeItem('token');
        window.location.reload();
      }}>
        Logout Account
      </button>
    </div>
  );
};

export default UserProfile;
