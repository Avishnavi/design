import React from 'react';
import './Dashboard.css';

const Dashboard = ({ user, history, onRequestPickup, onTrackPickup, onViewHistory }) => {
  // Dynamic stats calculation
  const totalRecycled = history
    .filter(p => p.status === 'Recycled' || p.status === 'SentToDealer')
    .reduce((sum, p) => sum + p.quantity, 0);
  
  const totalEarnings = totalRecycled * 15; // Mock: ₹15 per kg

  return (
    <div className="dashboard container">
      {/* User Header */}
      <header className="dashboard__header">
        <div className="user-profile-row">
          <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div className="user-info">
            <h1>Hello, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
            <p>Ready to make an impact today?</p>
          </div>
        </div>
      </header>

      {/* Stats Summary Row */}
      <div className="stats-summary-row">
        <div className="summary-card">
          <span className="summary-icon">♻️</span>
          <div className="summary-details">
            <span className="summary-value">{totalRecycled} kg</span>
            <span className="summary-label">Recycled</span>
          </div>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-card">
          <span className="summary-icon">💰</span>
          <div className="summary-details">
            <span className="summary-value">₹ {totalEarnings}</span>
            <span className="summary-label">Earnings</span>
          </div>
        </div>
      </div>

      {/* Primary Features Grid */}
      <section className="features-section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="features-grid">
          <div className="feature-card feature-card--primary" onClick={onRequestPickup}>
            <div className="feature-icon">♻️</div>
            <h4>Request Pickup</h4>
            <p>Schedule a waste collection</p>
          </div>
          
          <div className="feature-card" onClick={() => onTrackPickup(null)}>
            <div className="feature-icon">🚚</div>
            <h4>Track Orders</h4>
            <p>Check active pickup status</p>
          </div>

          <div className="feature-card" onClick={onViewHistory}>
            <div className="feature-icon">📜</div>
            <h4>History</h4>
            <p>View past transactions</p>
          </div>
        </div>
      </section>

      {/* Featured / Daily Tip Row */}
      <section className="daily-tip-section">
        <div className="tip-card card">
          <div className="tip-header">
            <span className="tip-icon">💡</span>
            <h3>Daily Recycling Tip</h3>
          </div>
          <p>Remember to rinse out your plastic containers before recycling to avoid contamination!</p>
          <button className="btn-tip-more">Learn More →</button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
