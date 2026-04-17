import React, { useState } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('overview');

  const pendingVerifications = [
    { id: 'USR-99', name: 'Eco Scraps Ltd', role: 'Dealer', docs: 'Verified', submitted: '2h ago' },
    { id: 'USR-102', name: 'John Driver', role: 'Collector', docs: 'Pending', submitted: '5h ago' },
  ];

  const activeDisputes = [
    { id: 'DIS-404', type: 'Weight Mismatch', parties: 'Jane (User) vs Rajesh (Coll.)', status: 'High Priority' },
  ];

  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <div className="admin-logo">🛡️ WasteWise Admin</div>
        <div className="nav-group">
          <small>MONITORING</small>
          <button className={activeView === 'overview' ? 'active' : ''} onClick={() => setActiveView('overview')}>Global Overview</button>
          <button className={activeView === 'analytics' ? 'active' : ''} onClick={() => setActiveView('analytics')}>Network Heatmap</button>
        </div>
        <div className="nav-group">
          <small>MANAGEMENT</small>
          <button className={activeView === 'users' ? 'active' : ''} onClick={() => setActiveView('users')}>User Verification</button>
          <button className={activeView === 'disputes' ? 'active' : ''} onClick={() => setActiveView('disputes')}>Dispute Center</button>
        </div>
        <div className="nav-group">
          <small>SYSTEM</small>
          <button>Commission Rates</button>
          <button>System Logs</button>
        </div>
      </nav>

      <main className="admin-main">
        <header className="admin-header">
          <h1>{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h1>
          <div className="system-status">System Health: <span className="health-online">ONLINE</span></div>
        </header>

        {activeView === 'overview' && (
          <div className="overview-grid">
            <div className="admin-stat-card card">
              <span>Total Waste Recycled</span>
              <h2>124.5 Tons</h2>
              <small className="trend-up">+12% this month</small>
            </div>
            <div className="admin-stat-card card">
              <span>Active Collectors</span>
              <h2>1,420</h2>
              <small>Across 12 Cities</small>
            </div>
            <div className="admin-stat-card card">
              <span>Platform Revenue</span>
              <h2>₹ 4.2 Lakhs</h2>
              <small>Commission (2.5%)</small>
            </div>
          </div>
        )}

        {activeView === 'users' && (
          <section className="verification-section card">
            <h2>Pending Verifications</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Entity Name</th>
                  <th>Role</th>
                  <th>Documents</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingVerifications.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td><strong>{user.name}</strong></td>
                    <td><span className={`role-pill ${user.role.toLowerCase()}`}>{user.role}</span></td>
                    <td>{user.docs}</td>
                    <td>{user.submitted}</td>
                    <td>
                      <button className="btn-approve">Approve</button>
                      <button className="btn-reject">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeView === 'disputes' && (
          <section className="dispute-section">
            <div className="dispute-grid">
              {activeDisputes.map(dispute => (
                <div key={dispute.id} className="dispute-card card">
                  <div className="dispute-header">
                    <span className="dispute-id">{dispute.id}</span>
                    <span className="priority-tag">{dispute.status}</span>
                  </div>
                  <h4>{dispute.type}</h4>
                  <p>{dispute.parties}</p>
                  <div className="dispute-actions">
                    <button className="btn-primary">Open Investigation</button>
                    <button className="btn-outline">Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
