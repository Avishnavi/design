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

  // Optimized Live Location Tracking
  useEffect(() => {
    let watchId;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 30000; // Only update backend every 30 seconds

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = [position.coords.longitude, position.coords.latitude];
          setCollectorLocation(coords);
          
          // Throttled update to backend to save resources
          const now = Date.now();
          if (now - lastUpdate > UPDATE_INTERVAL) {
            collectorAPI.updateLocation(coords).catch(err => {});
            lastUpdate = now;
          }
        },
        (error) => console.error('GPS Watch Error:', error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Optimized periodic data refresh
  useEffect(() => {
    fetchData();
    // Refresh every 45 seconds instead of 20 to reduce server load
    const interval = setInterval(fetchData, 45000);
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
      console.log(`[DEBUG] Sending status update: RequestID=${requestId}, Status=${status}`);
      const response = await collectorAPI.updateStatus(requestId, status);
      console.log(`[DEBUG] Update Response:`, response.data);
      
      if (status === 'SentToDealer') {
        setActivePickup(null);
        setView('dashboard');
        fetchData();
        alert('Pickup delivered to Scrap Dealer!');
      } else {
        setActivePickup(prev => ({ ...prev, status: response.data.data.status }));
      }
    } catch (error) {
      console.error('[ERROR] Failed to update status:', error.response?.data || error.message);
      alert(`Failed to update status: ${error.response?.data?.message || 'Server Error'}`);
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
    // Safety check: ensure coordinates exist and are valid [lng, lat]
    const pickupCoords = activePickup.location?.coordinates;
    const hasValidCoords = pickupCoords && pickupCoords.length === 2 && pickupCoords[0] !== 0;
    
    return (
      <div className="collector-active container">
        <header className="module-header-new">
          <div className="header-left-group">
            <button className="btn-back-circle" onClick={() => setView('dashboard')}>✕</button>
            <div className="header-title-box">
              <h2>Navigation</h2>
              <span className="status-indicator-dot"></span>
            </div>
          </div>
          <button className="btn-external-nav" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${pickupCoords[1]},${pickupCoords[0]}`)}>
            Maps App
          </button>
        </header>
        
        <div className="navigator-layout">
          <div className="map-frame">
            <MapComponent 
                userLocation={pickupCoords} 
                collectorLocation={collectorLocation} 
                pickupStatus={activePickup.status}
            />
          </div>

          <div className="navigator-details-card">
            <div className="customer-prime-info">
              <div className="avatar-med">{activePickup.userId?.name?.charAt(0) || 'U'}</div>
              <div className="name-addr">
                <h4>{activePickup.userId?.name || 'Customer'}</h4>
                <p>{activePickup.pickupAddress || 'Address not provided'}</p>
              </div>
            </div>

            <div className="quick-stats-row">
              <div className="q-stat">
                <span className="q-label">WASTE</span>
                <span className="q-value">{activePickup.wasteType || 'General'}</span>
              </div>
              <div className="q-stat">
                <span className="q-label">WEIGHT</span>
                <span className="q-value">{activePickup.quantity || 0} kg</span>
              </div>
              <div className="q-stat">
                <span className="q-label">REWARD</span>
                <span className="q-value">₹ {(activePickup.quantity || 0) * 12}</span>
              </div>
            </div>
            
            <div className="phase-control-box manual">
               <button 
                 className="btn-launch-maps" 
                 onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activePickup.location.coordinates[1]},${activePickup.location.coordinates[0]}`)}
               >
                 <span className="icon">🚀</span> Launch Google Maps
               </button>

               <div className="manual-update-section">
                 <label className="manual-label">Update Status Manually</label>
                 <select 
                   className="status-dropdown-fancy"
                   value={activePickup.status}
                   onChange={(e) => handleStatusUpdate(activePickup._id, e.target.value)}
                 >
                   <option value="Assigned">Assigned (Ready)</option>
                   <option value="On The Way">On The Way (Traveling)</option>
                   <option value="Arrived">Arrived (At Location)</option>
                   <option value="Collected">Collected (Waste Picked)</option>
                   <option value="SentToDealer">Handed Over (To Dealer)</option>
                 </select>
               </div>
               
               <div className="phase-text">Current State: <strong>{activePickup.status}</strong></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="collector-dashboard container">
      <header className="dashboard-header-new">
        <div className="header-text">
          <h1>Operations Dashboard</h1>
          <p>You are currently <strong>Online</strong> and discovering pickups.</p>
        </div>
        <button className="btn-history-pill" onClick={() => setView('history')}>
          📜 History
        </button>
      </header>

      <div className="stats-grid-new">
        <div className="stat-card-new">
          <div className="stat-icon-bg green">📈</div>
          <div className="stat-content">
            <span className="stat-value">{stats.activePickups || 0}</span>
            <span className="stat-label">Active Requests</span>
          </div>
        </div>
        <div className="stat-card-new">
          <div className="stat-icon-bg blue">💰</div>
          <div className="stat-content">
            <span className="stat-value">₹ {stats.earnings || 0}</span>
            <span className="stat-label">Total Earnings</span>
          </div>
        </div>
      </div>

      <section className="pickups-section">
        <div className="section-header">
          <h3 className="section-title">Incoming Tasks</h3>
          <span className="live-indicator">
            <span className="dot"></span> LIVE
          </span>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner-sm"></div>
            <p>Scanning for nearby waste...</p>
          </div>
        ) : (
          <div className="pickups-list-new">
            {pendingPickups.length === 0 ? (
                <div className="empty-state-card">
                  <span className="empty-icon">📭</span>
                  <p>All clear! No pending requests in your area.</p>
                </div>
            ) : (
                pendingPickups.map(pickup => (
                <div key={pickup._id} className="pickup-item-card">
                    <div className="pickup-main">
                      <div className="user-brief-new">
                        <div className="user-avatar-sm">{pickup.userId?.name?.charAt(0) || 'U'}</div>
                        <div className="user-meta">
                          <h4>{pickup.userId?.name || 'Guest User'}</h4>
                          <span className="time-ago">{new Date(pickup.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                      <div className="pickup-address-box">
                        <span className="loc-icon">📍</span>
                        <p>{pickup.pickupAddress}</p>
                      </div>
                      <div className="pickup-tags">
                        <span className="tag type">{pickup.wasteType}</span>
                        <span className="tag weight">{pickup.quantity} kg</span>
                        <span className={`tag status-chip ${pickup.status.toLowerCase()}`}>{pickup.status}</span>
                      </div>
                    </div>
                    
                    <div className="pickup-footer">
                        {pickup.status === 'Pending' ? (
                            <button className="btn-action accept" onClick={() => handleAccept(pickup._id)}>Accept Task</button>
                        ) : (
                            <button className="btn-action navigate" onClick={() => showOnMap(pickup)}>Open Navigator</button>
                        )}
                        <button className="btn-action-outline" onClick={() => handleReject(pickup._id)}>Pass</button>
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
