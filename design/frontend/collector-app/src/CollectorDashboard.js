import React, { useState, useEffect, useCallback } from 'react';
import './CollectorDashboard.css';
import { collectorAPI } from './api';
import MapComponent from './MapComponent';
import PickupHistory from './PickupHistory';

const CollectorDashboard = () => {
  const [activePickup, setActivePickup] = useState(null);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [stats, setStats] = useState({ totalPickups: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'history', 'map'
  const [collectorLocation, setCollectorLocation] = useState([77.5946, 12.9716]); // Default [lng, lat]

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[DEBUG] Fetching dashboard and requests...');
      const [dashRes, reqRes] = await Promise.all([
        collectorAPI.getDashboard(),
        collectorAPI.getPickupRequests()
      ]);
      console.log('[DEBUG] Dashboard Stats:', dashRes.data.data);
      console.log('[DEBUG] Pickup Requests Received:', reqRes.data.data);
      setStats(dashRes.data.data);
      setPendingPickups(reqRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live Location Tracking (High Precision)
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = [position.coords.longitude, position.coords.latitude];
          setCollectorLocation(coords);
          // Debounced update to backend
          collectorAPI.updateLocation(coords).catch(err => {});
        },
        (error) => console.error('GPS Watch Error:', error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Periodic data refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAccept = async (requestId) => {
    try {
      await collectorAPI.acceptRequest(requestId);
      fetchData();
      alert('Request accepted!');
    } catch (error) {
      alert('Failed to accept request');
    }
  };

  const handleReject = (requestId) => {
    // Soft reject: Hide from current list
    setPendingPickups(prev => prev.filter(p => p._id !== requestId));
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await collectorAPI.updateStatus(requestId, status);
      if (status === 'SentToDealer') {
        setActivePickup(null);
        setView('dashboard');
        fetchData();
        alert('Pickup delivered to Scrap Dealer!');
      } else {
        setActivePickup(prev => ({ ...prev, status }));
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const showOnMap = (pickup) => {
    setActivePickup(pickup);
    setView('map');
  };

  if (view === 'history') {
    return <PickupHistory onBack={() => setView('dashboard')} />;
  }

  if (view === 'map' && activePickup) {
    const hasCoordinates = activePickup.location?.coordinates && collectorLocation;
    
    return (
      <div className="collector-active container">
        <header className="module-header">
          <button className="btn-back" onClick={() => setView('dashboard')}>← Back</button>
          <h2>Navigation</h2>
        </header>
        
        {hasCoordinates ? (
          <MapComponent 
              userLocation={activePickup.location.coordinates} 
              collectorLocation={collectorLocation} 
          />
        ) : (
          <div className="map-error card">⚠️ GPS Signal Waiting...</div>
        )}

        <div className="pickup-details-card card">
          <div className="pickup-info-header">
            <h4>{activePickup.userId?.name || 'Guest User'}</h4>
            {activePickup.location?.coordinates && (
              <button 
                className="btn-navigate" 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activePickup.location.coordinates[1]},${activePickup.location.coordinates[0]}`)}
              >
                🚀 Navigate
              </button>
            )}
          </div>
          <p>{activePickup.pickupAddress || 'No address provided'}</p>
          <div className="waste-badge">{activePickup.wasteType || 'General'} • {activePickup.quantity || 0}kg</div>
          
          <div className="status-action-row">
             {activePickup.status === 'Assigned' && (
               <button className="btn-status-update journey" onClick={() => handleStatusUpdate(activePickup._id, 'On The Way')}>
                 ▶️ Start Journey
               </button>
             )}
             {activePickup.status === 'On The Way' && (
               <button className="btn-status-update collect" onClick={() => handleStatusUpdate(activePickup._id, 'Collected')}>
                 📦 Mark as Collected
               </button>
             )}
             {activePickup.status === 'Collected' && (
               <button className="btn-status-update deliver" onClick={() => handleStatusUpdate(activePickup._id, 'SentToDealer')}>
                 🏭 Deliver to Dealer
               </button>
             )}
             <div className="current-status-tag">Status: <strong>{activePickup.status}</strong></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="collector-dashboard container">
      <header className="dashboard__header">
        <div className="header-row">
          <h1>Collector Portal 🚚</h1>
          <button className="btn-history-toggle" onClick={() => setView('history')}>
            View History
          </button>
        </div>
        <p>Available pickups in your area</p>
      </header>

      <div className="collector-stats-row">
        <div className="c-stat">
          <span className="c-stat-val">{stats.activePickups || 0}</span>
          <span className="c-stat-lbl">Active</span>
        </div>
        <div className="c-stat">
          <span className="c-stat-val">₹ {stats.earnings || 0}</span>
          <span className="c-stat-lbl">Earnings</span>
        </div>
      </div>

      <section className="pickups-section">
        <h3 className="section-title">Pickup Requests</h3>
        {loading ? (
          <p>Loading requests...</p>
        ) : (
          <div className="pickups-list">
            {pendingPickups.length === 0 ? (
                <p className="empty-msg">No pending requests.</p>
            ) : (
                pendingPickups.map(pickup => (
                <div key={pickup._id} className="pickup-row-card card">
                    <div className="pickup-main-info">
                    <div className="pickup-loc">
                        <h4>{pickup.userId?.name || 'User'}</h4>
                        <p>{pickup.pickupAddress}</p>
                        <small>{pickup.wasteType} • {pickup.quantity}kg • {new Date(pickup.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div className="pickup-est"><span className="est-tag">{pickup.status}</span></div>
                    </div>
                    
                    <div className="pickup-actions">
                        {pickup.status === 'Pending' ? (
                            <button className="btn-accept" onClick={() => handleAccept(pickup._id)}>Accept</button>
                        ) : (
                            <button className="btn-map" onClick={() => showOnMap(pickup)}>View on Map</button>
                        )}
                        <button className="btn-reject-outline" onClick={() => handleReject(pickup._id)}>Reject</button>
                    </div>
                </div>
                ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default CollectorDashboard;
