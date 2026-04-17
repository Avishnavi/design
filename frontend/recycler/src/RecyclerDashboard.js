import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecyclerDashboard.css';

const API_BASE = 'http://localhost:5000/api';

const RecyclerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // Merged Tab
  const token = localStorage.getItem('recyclerToken');
  
  // Data States
  const [availableScrap, setAvailableScrap] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [profile, setProfile] = useState({ 
    name: '', companyName: '', email: '', phone: '', address: '', area: '', 
    district: '', state: '', country: '', maxPurchaseCapacity: '', acceptedMaterials: [] 
  });
  
  const [loading, setLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  // Setup Axios Instance
  const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const handleLogout = () => {
    localStorage.removeItem('recyclerToken');
    window.location.reload();
  };

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [scrapRes, dashRes, reportsRes] = await Promise.all([
        api.get('/recyclers/available-scrap').catch(() => ({ data: { data: [] } })),
        api.get('/recyclers/dashboard').catch(() => ({ data: { data: null } })),
        api.get('/recyclers/reports').catch(() => ({ data: { data: null } }))
      ]);
      setAvailableScrap(scrapRes.data.data || []);
      setDashboardData(dashRes.data.data);
      setReportsData(reportsRes.data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchDashboardDataOnly = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recyclers/dashboard');
      setDashboardData(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recyclers/profile');
      setProfile(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'overview') fetchOverviewData();
    else if (activeTab === 'processing') fetchDashboardDataOnly();
    else if (activeTab === 'settings') fetchProfile();
  }, [activeTab, token]); 

  const handleBuyScrap = async (dealerId, wasteType, quantity, price) => {
    setLoading(true);
    try {
      await api.post('/recyclers/buy-scrap', { dealerId, wasteType, quantity, price });
      alert('Scrap batch successfully acquired!');
      fetchOverviewData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to purchase scrap');
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (transactionId, newStatus) => {
    setLoading(true);
    try {
      await api.post('/recyclers/update-recycling-status', { transactionId, status: newStatus });
      fetchDashboardDataOnly(); 
    } catch (err) { alert('Failed to update status'); }
    setLoading(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUpdateMsg('');
    try {
      await api.put('/recyclers/update-profile', profile);
      setUpdateMsg('Profile updated successfully! ✅');
      setTimeout(() => setUpdateMsg(''), 3000);
    } catch (err) { alert('Failed to update profile'); }
    setLoading(false);
  };

  const handleMaterialToggle = (type) => {
    const materials = profile.acceptedMaterials || [];
    const updated = materials.includes(type) ? materials.filter(t => t !== type) : [...materials, type];
    setProfile({ ...profile, acceptedMaterials: updated });
  };

  const handleDownloadReport = () => {
    if (!dashboardData || !dashboardData.allTransactions || dashboardData.allTransactions.length === 0) {
      alert("No active transactions available to generate a report.");
      return;
    }
    const headers = "Transaction ID,Dealer Name,Material Type,Quantity (kg),Purchased Price,Status\n";
    const rows = dashboardData.allTransactions.map(tx => {
      const dealer = tx.scrapDealerId?.dealerName || 'Unknown Dealer';
      return `${tx._id},${dealer},${tx.wasteType},${tx.quantity},${tx.price || 0},${tx.status}`;
    }).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Recycling_Activity_Manifest_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="recycler-dashboard light-theme">
      <nav className="top-nav modern-nav">
        <div className="logo"><span className="icon">🌿</span> EcoProcess</div>
        <div className="nav-links">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={activeTab === 'processing' ? 'active' : ''} onClick={() => setActiveTab('processing')}>Processing</button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Facility Settings</button>
        </div>
        <div className="user-profile" onClick={handleLogout}>Sign Out <span className="logout-icon">⇥</span></div>
      </nav>

      <div className="content-area container">
        {activeTab === 'overview' && (
          <div className="overview-tab fade-in">
            {/* Top Header */}
            <div className="view-header">
              <div>
                <h2>Factory Dashboard</h2>
                <p className="subtitle">Real-time marketplace, live metrics, and recycling analytics.</p>
              </div>
              <div className="header-actions">
                  <button className="btn-outline-primary" onClick={handleDownloadReport}>⬇ Extract CSV Report</button>
                  <button className="btn-primary" onClick={fetchOverviewData}>↻ Sync Network</button>
              </div>
            </div>

            {loading && !dashboardData && <p className="loading-state">Syncing factory framework...</p>}
            
            {/* Stats Overview */}
            {dashboardData && (
              <section className="stats-section mb-5">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon icon-blue">📦</div>
                    <div className="stat-details">
                       <p>Total Procured Material</p>
                       <h3>{dashboardData.totalPurchased} kg</h3>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon icon-green">♻️</div>
                    <div className="stat-details">
                       <p>Successfully Processed</p>
                       <h3>{dashboardData.totalRecycled} kg</h3>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon icon-orange">⚙️</div>
                    <div className="stat-details">
                       <p>Pending Machining</p>
                       <h3>{dashboardData.pendingMaterials} kg</h3>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Marketplace Grid */}
            <section className="marketplace-section mb-5">
               <div className="section-head">
                 <h3>Live Scrap Marketplace</h3>
               </div>
               <div className="offers-grid">
                 {availableScrap.map((item, idx) => (
                   <div key={idx} className="offer-card card-light-hover">
                     <div className="offer-header">
                       <span className="offer-category">{item.wasteType}</span>
                       <span className="stock-badge">Secure Stock</span>
                     </div>
                     <h3 className="dealer-title">{item.dealerName}</h3>
                     <div className="offer-body">
                       <div className="offer-row"><span className="label">Location:</span> <span>{item.dealerArea}</span></div>
                       <div className="offer-row"><span className="label">Yield Available:</span> <strong>{item.quantity} kg</strong></div>
                       <div className="offer-price">₹ {item.pricePerKg} <span>/ kg basis</span></div>
                     </div>
                     <button className="btn-accept w-100" onClick={() => handleBuyScrap(item.dealerId, item.wasteType, item.quantity, item.pricePerKg)}>
                        Acquire Batch Manifest
                     </button>
                   </div>
                 ))}
                 {availableScrap.length === 0 && !loading && (
                    <div className="empty-state card">
                       <p>The marketplace feed is empty. Awaiting fresh regional dealer stock.</p>
                    </div>
                 )}
               </div>
            </section>
            
            {/* Short Reports snippet */}
            {reportsData && reportsData.breakdown.length > 0 && (
               <section className="reports-section">
                 <div className="section-head">
                   <h3>Process Yield Analytics</h3>
                 </div>
                 <div className="breakdown-grid">
                    {reportsData.breakdown.map((item, idx) => (
                      <div key={idx} className="breakdown-card card">
                        <h4 className="waste-title">{item.type}</h4>
                        <div className="waste-amount">{item.quantity} kg recycled</div>
                      </div>
                    ))}
                 </div>
               </section>
            )}
          </div>
        )}

        {/* PROCESSING TAB */}
        {activeTab === 'processing' && (
          <section className="inspection-view card card-padding fade-in">
            <div className="view-header mb-4" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
               <h2>Active Processing Pipelines</h2>
               <p className="subtitle">Track and finalize lifecycle states for dealer-acquired scrap manifests.</p>
            </div>
            {loading ? <p className="loading-state">Loading pipelines...</p> : dashboardData && (
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Txn Code</th>
                      <th>Origin Source</th>
                      <th>Material Class</th>
                      <th>Volume Base</th>
                      <th>Lifecycle Phase</th>
                      <th>Operator Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.allTransactions.map(tx => (
                      <tr key={tx._id}>
                        <td className="mute-text">#{tx._id.substring(0, 8)}</td>
                        <td className="strong-text">{tx.scrapDealerId?.dealerName || 'Unknown Dealer'}</td>
                        <td><span className="material-pill">{tx.wasteType}</span></td>
                        <td>{tx.quantity} kg</td>
                        <td>
                          <span className={`status-dot ${tx.status.toLowerCase()}`}></span>
                          {tx.status}
                        </td>
                        <td>
                          {tx.status === 'Purchased' && (
                            <button className="btn-outline-primary sm-btn" onClick={() => handleUpdateStatus(tx._id, 'Processing')}>Engage Machining</button>
                          )}
                          {tx.status === 'Processing' && (
                            <button className="btn-accept sm-btn" onClick={() => handleUpdateStatus(tx._id, 'Recycled')}>Finalize Output</button>
                          )}
                          {tx.status === 'Recycled' && (
                            <span className="text-success"><span className="icon">✓</span> Concluded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {dashboardData.allTransactions.length === 0 && (
                      <tr><td colSpan="6" className="text-center empty-cell">No workflow logs registered in current quarter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <section className="settings-section fade-in">
             <div className="view-header mb-4" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <h2>Facility Identity Matrix</h2>
              <p className="subtitle">Administer core industrial capacities, region locators, and accepted classes.</p>
            </div>
            <form className="card card-padding" onSubmit={handleProfileUpdate}>
              <div className="form-two-col">
                <div className="form-pane">
                  <h3 className="pane-title">Organizational Specs</h3>
                  <div className="form-group">
                    <label>Assigned Operator Name</label>
                    <input type="text" className="input-modern" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Plant Entity Header</label>
                    <input type="text" className="input-modern" value={profile.companyName || ''} onChange={e => setProfile({...profile, companyName: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Maximum Structural Capacity (kg)</label>
                    <input type="number" className="input-modern" value={profile.maxPurchaseCapacity || ''} onChange={e => setProfile({...profile, maxPurchaseCapacity: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Acceptable Waste Classes</label>
                    <div className="materials-chip-group">
                      {['Paper', 'Plastic', 'Metal', 'E-waste', 'Glass'].map(type => (
                        <button
                          key={type} type="button" onClick={() => handleMaterialToggle(type)}
                          className={`material-chip ${profile.acceptedMaterials?.includes(type) ? 'active' : ''}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-pane">
                  <h3 className="pane-title">Locational Mapping</h3>
                  <div className="form-group">
                    <label>Area Layout String</label>
                    <input type="text" className="input-modern" value={profile.area || ''} onChange={e => setProfile({...profile, area: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>District Municipality</label>
                    <input type="text" className="input-modern" value={profile.district || ''} onChange={e => setProfile({...profile, district: e.target.value})} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>State Region</label>
                      <input type="text" className="input-modern" value={profile.state || ''} onChange={e => setProfile({...profile, state: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Country Descriptor</label>
                      <input type="text" className="input-modern" value={profile.country || ''} onChange={e => setProfile({...profile, country: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-footer mt-4">
                <button type="submit" className="btn-primary form-submit-btn" disabled={loading}>
                  {loading ? 'Committing...' : 'Commit Facility Profile Sync'}
                </button>
                {updateMsg && <span className="msg-success ml-3">{updateMsg}</span>}
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
};

export default RecyclerDashboard;
