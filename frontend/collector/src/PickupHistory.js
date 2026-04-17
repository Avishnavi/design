import React, { useState, useEffect } from 'react';
import { collectorAPI } from './api';
import './PickupHistory.css';

const PickupHistory = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [filter, setFilter] = useState('all');

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.status.toLowerCase().replace(/\s/g, '') === filter;
  });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await collectorAPI.getPickupHistory();
        setHistory(response.data.data);
        
        // Calculate earnings roughly for history
        const earnings = response.data.data.reduce((acc, item) => acc + (item.agreedPrice || item.quantity * 12), 0);
        setTotalEarnings(earnings);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="pickup-history-premium fade-in">
      <header className="history-header">
        <div className="history-header-left">
          <button className="btn-back-circle history-back" onClick={onBack}>✕</button>
          <div className="history-title">
            <h2>Logbook & History</h2>
            <p>Review your completed and delivered pickups</p>
          </div>
        </div>
        <div className="history-header-right">
          <div className="history-stat">
            <span className="h-label">All-time Earnings</span>
            <span className="h-value">₹ {totalEarnings.toLocaleString()}</span>
          </div>
          <div className="history-stat">
            <span className="h-label">Total Jobs</span>
            <span className="h-value">{history.length}</span>
          </div>
        </div>
      </header>

      <div className="history-filters">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All History
        </button>
        <button 
          className={`filter-tab ${filter === 'senttodealer' ? 'active' : ''}`}
          onClick={() => setFilter('senttodealer')}
        >
          Sent to Dealer
        </button>
        <button 
          className={`filter-tab ${filter === 'recycled' ? 'active' : ''}`}
          onClick={() => setFilter('recycled')}
        >
          Successfully Recycled
        </button>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner-sm"></div>
            <p>Loading your logistics history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-state-card">
             <span className="empty-icon">📭</span>
             <p>No past pickups found for this category.</p>
          </div>
        ) : (
          <div className="history-timeline">
            {filteredHistory.map((item) => (
              <div key={item._id} className="history-card">
                <div className="history-date-box">
                  <span className="h-day">{new Date(item.createdAt).getDate()}</span>
                  <span className="h-month">{new Date(item.createdAt).toLocaleString('default', { month: 'short' })}</span>
                </div>
                
                <div className="history-details">
                   <div className="h-top-row">
                     <h4>{item.userId?.name || 'Guest User'}</h4>
                     <span className={`h-status ${item.status.toLowerCase().replace(/\s/g, '')}`}>
                       {item.status === 'SentToDealer' ? 'Sent To Dealer' : item.status}
                     </span>
                   </div>
                   
                   <p className="h-address">📍 {item.pickupAddress}</p>
                   
                   <div className="h-tags">
                     <span className="h-tag type">📦 {item.wasteType}</span>
                     <span className="h-tag weight">⚖️ {item.quantity} kg</span>
                     <span className="h-tag price">💰 ₹ {item.agreedPrice || item.quantity * 12}</span>
                     {item.assignedDealer && (
                       <span className="h-tag dealer">🏢 Delivered to {item.assignedDealer?.dealerName || 'Dealer'}</span>
                     )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupHistory;
