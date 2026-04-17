import React, { useState } from 'react';
import './CollectorDashboard.css';

const CollectorDashboard = ({ onAccept, onReject, onDealerAssign }) => {
  const [activePickup, setActivePickup] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [weight, setWeight] = useState('');
  const [isDealerMode, setIsDealerMode] = useState(false);

  const pendingPickups = [
    { id: 101, user: 'Jane Doe', address: '123 Green Lane, Eco City', wasteType: 'Plastic', estWeight: '5-7 kg', distance: '1.2 km' },
    { id: 102, user: 'John Smith', address: '456 Blue Ave, Sea Side', wasteType: 'Metal', estWeight: '2-3 kg', distance: '3.5 km' },
  ];

  const handleAcceptClick = (pickup) => {
    setActivePickup(pickup);
    onAccept(); // Notify user via App.js
  };

  const handleRejectClick = (pickupId) => {
    onReject(); // Notify user via App.js
    alert(`Request ${pickupId} rejected. User will be notified.`);
  };

  const handleDealerAssignClick = (pickupId) => {
    onDealerAssign(); // Notify user via App.js
    alert(`Collector assigned manually by Dealer for order ${pickupId}`);
  };

  const handleVerify = () => setShowVerification(true);

  const handleComplete = () => {
    alert(`Pickup verified! Weight: ${weight}kg. Earnings added to your wallet.`);
    setActivePickup(null);
    setShowVerification(false);
    setWeight('');
  };

  if (activePickup && !showVerification) {
    return (
      <div className="collector-active container">
        <header className="module-header">
          <button className="btn-back" onClick={() => setActivePickup(null)}>← Back</button>
          <h2>Active Pickup</h2>
        </header>
        <div className="tracking-map-placeholder card">
          <div className="map-ui"><div className="map-marker collector">🚚</div></div>
          <div className="map-info"><span>Navigating to {activePickup.user}</span></div>
        </div>
        <div className="pickup-details-card card">
          <h4>{activePickup.user}</h4>
          <p>{activePickup.address}</p>
          <div className="waste-badge">{activePickup.wasteType}</div>
          <button className="btn-arrive" onClick={handleVerify}>Arrived at Location ✅</button>
        </div>
      </div>
    );
  }

  return (
    <div className="collector-dashboard container">
      <header className="dashboard__header">
        <div className="header-row">
          <h1>{isDealerMode ? 'Dealer Admin' : 'Collector Portal'} 🚚</h1>
          <button className="btn-mode-switch" onClick={() => setIsDealerMode(!isDealerMode)}>
            Switch to {isDealerMode ? 'Collector' : 'Dealer'}
          </button>
        </div>
        <p>{isDealerMode ? 'Manage and assign collection requests' : 'Available pickups in your area'}</p>
      </header>

      {!isDealerMode && (
        <div className="collector-stats-row">
          <div className="c-stat"><span className="c-stat-val">12</span><span className="c-stat-lbl">Pickups</span></div>
          <div className="c-stat"><span className="c-stat-val">₹ 1,240</span><span className="c-stat-lbl">Earnings</span></div>
        </div>
      )}

      <section className="pickups-section">
        <h3 className="section-title">Incoming Requests</h3>
        <div className="pickups-list">
          {pendingPickups.map(pickup => (
            <div key={pickup.id} className="pickup-row-card card">
              <div className="pickup-main-info">
                <div className="pickup-loc">
                  <h4>{pickup.user}</h4>
                  <p>{pickup.address}</p>
                  <small>{pickup.wasteType} • {pickup.distance}</small>
                </div>
                <div className="pickup-est"><span className="est-tag">{pickup.estWeight}</span></div>
              </div>
              
              <div className="pickup-actions">
                {isDealerMode ? (
                  <>
                    <button className="btn-assign" onClick={() => handleDealerAssignClick(pickup.id)}>Assign Collector</button>
                    <button className="btn-reject-outline" onClick={() => handleRejectClick(pickup.id)}>Cancel Request</button>
                  </>
                ) : (
                  <>
                    <button className="btn-accept" onClick={() => handleAcceptClick(pickup)}>Accept</button>
                    <button className="btn-reject-outline" onClick={() => handleRejectClick(pickup.id)}>Reject</button>
                  </>
                ) }
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CollectorDashboard;
