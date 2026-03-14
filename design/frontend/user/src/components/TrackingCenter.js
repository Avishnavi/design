import React, { useState, useEffect } from 'react';
import './TrackingCenter.css';
import PickupTracking from './PickupTracking';

const TrackingCenter = ({ history, initialPickup }) => {
  const activePickups = history.filter(p => 
    p.status !== 'Recycled' && p.status !== 'Cancelled' && p.status !== 'Completed' && p.status !== 'SentToDealer'
  );

  const [selectedPickup, setSelectedPickup] = useState(initialPickup);

  useEffect(() => {
    if (initialPickup) {
      setSelectedPickup(initialPickup);
    }
  }, [initialPickup]);

  const getWasteIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'plastic': return '🥤';
      case 'paper': return '📄';
      case 'metal': return '⚙️';
      case 'electronic':
      case 'e-waste': return '💻';
      case 'glass': return '🍷';
      default: return '📦';
    }
  };

  // 1. If nothing is selected, show ALL requests spread across the page in a grid
  if (!selectedPickup) {
    return (
      <div className="tracking-center container">
        <div className="tracking-selection-view">
          <h2>Active Tracking Requests</h2>
          <p className="subtitle">Select a request to see live updates</p>
          
          <div className="tracking-grid-full">
            {activePickups.length === 0 ? (
              <div className="empty-tracking-full card">
                <span className="icon">📭</span>
                <p>No active pickups to track.</p>
              </div>
            ) : (
              activePickups.map(pickup => (
                <div 
                  key={pickup._id} 
                  className="tracking-grid-card card"
                  onClick={() => setSelectedPickup(pickup)}
                >
                  <div className="grid-icon">{getWasteIcon(pickup.wasteType)}</div>
                  <div className="grid-info">
                    <h4>{pickup.wasteType}</h4>
                    <span className="grid-status-badge">{pickup.status}</span>
                    <p className="grid-meta">{pickup.quantity}kg • {new Date(pickup.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="grid-action">Track Request →</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. If a request is selected, show the split view (list on left, details on right)
  return (
    <div className="tracking-center container">
      <div className="tracking-layout">
        <div className="tracking-sidebar">
          <div className="sidebar-header">
            <h3>Active Tracking</h3>
            <button className="btn-change-view" onClick={() => setSelectedPickup(null)}>View All</button>
          </div>
          
          <div className="tracking-mini-list">
            {activePickups.map(pickup => (
              <div 
                key={pickup._id} 
                className={`mini-card ${selectedPickup?._id === pickup._id ? 'active' : ''}`}
                onClick={() => setSelectedPickup(pickup)}
              >
                <div className="mini-icon">{getWasteIcon(pickup.wasteType)}</div>
                <div className="mini-info">
                  <h4>{pickup.wasteType}</h4>
                  <span className="mini-status">{pickup.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tracking-content">
          <div className="detail-wrapper">
            <PickupTracking 
              pickup={selectedPickup} 
              onBack={() => setSelectedPickup(null)} 
              hideHeader={true} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingCenter;
