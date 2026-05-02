import React, { useState, useEffect, useCallback } from 'react';
import './DealerDashboard.css';

const DealerDashboard = () => {
  const [view, setView] = useState('inventory'); // 'inventory', 'deliveries', 'transactions', 'settings'
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wasteDeliveries, setWasteDeliveries] = useState([]);
  const [marketplace, setMarketplace] = useState([]); // Recyclers to sell to
  const [stats, setStats] = useState({ totalInventory: 0, totalEarnings: 0, storageCapacity: 0, currentLoad: 0, batchCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({ name: '', area: '', district: '', state: '', country: '', location: { coordinates: [0, 0] } });
  const [updateMsg, setUpdateMsg] = useState('');

  // Sell Modal State
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellingItem, setSellingItem] = useState(null);
  const [selectedRecycler, setSelectedRecycler] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  // Modal State
  const [contactModal, setContactModal] = useState(null); // { type: 'Collector' | 'Recycler', data: Object, title: String }

  const fetchData = useCallback(async (endpoint, setter) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      setter(data.data || data);
    } catch (error) {
      console.error('[FETCH ERROR]', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'inventory') {
      fetchData('dealer/inventory', setInventory);
      fetchData('dealer/dashboard', setStats);
    } else if (view === 'transactions') {
      fetchData('dealer/transactions', setTransactions);
    } else if (view === 'deliveries') {
      fetchData('dealer/waste-from-collectors', setWasteDeliveries);
    } else if (view === 'settings') {
      fetchData('user/profile', setProfile);
    }
  }, [view, fetchData]);

  useEffect(() => {
    fetchData('user/profile', setProfile);
  }, [fetchData]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUpdateMsg('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/dealer/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      setUpdateMsg('Profile updated successfully! ✅');
      setTimeout(() => setUpdateMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (deliveryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/dealer/verify-waste`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deliveryId })
      });

      if (!response.ok) throw new Error('Verification failed');

      alert('Waste verified and added to inventory!');
      fetchData('dealer/waste-from-collectors', setWasteDeliveries);
    } catch (error) {
      alert(error.message);
    }
  };

  const initSellScrap = async (item) => {
    setSellingItem(item);
    setSellQuantity(item.stock || '');
    setSellPrice('');
    setSelectedRecycler('');
    setSellModalOpen(true);
    // Fetch recyclers list
    fetchData('recyclers', setMarketplace);
  };

  const submitSell = async () => {
    if (!selectedRecycler || !sellQuantity || !sellPrice) {
      alert('Please select a recycler and enter details.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/dealer/sell-to-recycler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recyclerId: selectedRecycler,
          wasteType: sellingItem.type,
          quantity: parseFloat(sellQuantity),
          price: parseFloat(sellPrice)
        })
      });

      if (!response.ok) throw new Error('Sale failed');

      alert('Sale executed successfully!');
      setSellModalOpen(false);
      // Refresh inventory
      fetchData('dealer/inventory', setInventory);
      fetchData('dealer/dashboard', setStats);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const openCollectorModal = (d) => {
    setContactModal({
      type: 'Collector',
      title: 'Collector Contact Details',
      details: [
        { label: 'Verified Name', value: d.collectorName },
        { label: 'Mobile Number', value: d.collectorPhone },
        { label: 'Email Address', value: d.collectorEmail }
      ]
    });
  };

  const openRecyclerModal = (t) => {
    setContactModal({
      type: 'Recycler',
      title: 'Recycler Contract Profile',
      details: [
        { label: 'Industrial Entity', value: t.recyclerName },
        { label: 'Operational Base', value: t.companyArea },
        { label: 'Corporate Mobile', value: t.recyclerPhone },
        { label: 'Corporate Email', value: t.recyclerEmail }
      ]
    });
  };

  return (
    <div className="dealer-dashboard light-theme">
      {contactModal && (
        <div className="modal-overlay fade-in" onClick={() => setContactModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
             <div className="modal-header">
                <h3>{contactModal.title}</h3>
                <button className="close-btn" onClick={() => setContactModal(null)}>✕</button>
             </div>
             <div className="modal-body">
                {contactModal.details.map((field, idx) => (
                   <div className="detail-row" key={idx}>
                      <span className="detail-label">{field.label}</span>
                      <span className="detail-value">{field.value}</span>
                   </div>
                ))}
             </div>
             <div className="modal-footer">
                <button className="btn-outline-primary w-100" onClick={() => setContactModal(null)}>Close Overlay</button>
             </div>
          </div>
        </div>
      )}

      {sellModalOpen && sellingItem && (
        <div className="modal-overlay fade-in" onClick={() => setSellModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
             <div className="modal-header">
                <h3>Sell Material: {sellingItem.type}</h3>
                <button className="close-btn" onClick={() => setSellModalOpen(false)}>✕</button>
             </div>
             <div className="modal-body">
                <div className="form-group">
                   <label>Select Target Recycler</label>
                   <select className="input-modern" value={selectedRecycler} onChange={(e) => setSelectedRecycler(e.target.value)}>
                      <option value="">-- Choose Recycler --</option>
                      {(marketplace || []).map(r => (
                        <option key={r._id} value={r._id}>{r.name || r.companyName} ({r.area || 'Unknown Area'})</option>
                      ))}
                   </select>
                </div>
                <div className="form-group mt-4">
                   <label>Quantity to Sell (Max: {sellingItem.stock} kg)</label>
                   <input type="number" className="input-modern" max={sellingItem.stock} value={sellQuantity} onChange={(e) => setSellQuantity(e.target.value)} />
                </div>
                <div className="form-group mt-4">
                   <label>Agreed Price (₹)</label>
                   <input type="number" className="input-modern" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
                </div>
             </div>
             <div className="modal-footer" style={{display:'flex', gap:'12px'}}>
                <button className="btn-outline-primary w-100" onClick={() => setSellModalOpen(false)}>Cancel</button>
                <button className="btn-primary w-100" onClick={submitSell}>Process Sale</button>
             </div>
          </div>
        </div>
      )}

      <nav className="top-nav modern-nav">
        <div className="logo"><span className="icon">🏢</span> WasteWise <span className="logo-badge">Dealer Portal</span></div>
        <div className="nav-links">
          <button className={view === 'inventory' ? 'active' : ''} onClick={() => setView('inventory')}>Warehouse Stock</button>
          <button className={view === 'deliveries' ? 'active' : ''} onClick={() => setView('deliveries')}>Collector Log</button>
          <button className={view === 'transactions' ? 'active' : ''} onClick={() => setView('transactions')}>Recycler Ledgers</button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>Business Profile</button>
        </div>
        <div className="user-profile" onClick={handleLogout}>Sign Out <span className="logout-icon">⇥</span></div>
      </nav>

      <main className="content-area container">
        {loading && !inventory.length && !wasteDeliveries.length && !transactions.length && <div className="loading-state card">Loading internal components...</div>}

        {error && <div className="error-alert fade-in">{error}</div>}

        {view === 'inventory' && (
          <section className="inventory-section fade-in">
            <div className="view-header">
               <div>
                  <h2>Warehouse Metrics</h2>
                  <p className="subtitle">Track aggregate holdings and storage load status.</p>
               </div>
               <button className="btn-primary" onClick={() => { fetchData('dealer/inventory', setInventory); fetchData('dealer/dashboard', setStats); }}>↻ Run Stock Sync</button>
            </div>

            <div className="stats-grid mb-5">
              <div className="stat-card">
                <div className="stat-icon icon-blue">📦</div>
                <div className="stat-details">
                  <p>Aggregate Stock</p>
                  <h3>{stats.totalInventory} kg</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon icon-green">💰</div>
                <div className="stat-details">
                  <p>Lifetime Revenue</p>
                  <h3>₹ {stats.totalEarnings}</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon icon-orange">⚖️</div>
                <div className="stat-details">
                  <p>Storage Load Protocol</p>
                  <h3>{stats.storageCapacity > 0 ? (((stats.currentLoad || 0) / stats.storageCapacity) * 100).toFixed(1) : 0}%</h3>
                  <small className="mute-text" style={{fontSize: '0.8rem'}}>{stats.currentLoad || 0} / {stats.storageCapacity || 0} max load</small>
                </div>
              </div>
            </div>

            <div className="card card-padding">
              <h3 className="pane-title">Stored Materials Log</h3>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>SKU Type</th>
                      <th>Gross Volume</th>
                      <th>Registered Quality</th>
                      <th>Market Value (Est)</th>
                      <th>Outbound Route</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, idx) => (
                      <tr key={idx}>
                        <td><span className="material-pill">{item.type}</span></td>
                        <td className="strong-text">{item.stock} kg</td>
                        <td><span className={`status-dot ${(item.grade && item.grade !== 'N/A') ? item.grade.toLowerCase() : 'a'}`}></span> {(item.grade && item.grade !== 'N/A') ? `Class ${item.grade}` : 'Standard Grade'}</td>
                        <td className="text-success strong-text">₹ {item.value || (item.stock * 10)}</td>
                        <td>
                          {item.stock > 0 ? (
                            <button className="btn-outline-primary sm-btn" onClick={() => initSellScrap(item)}>Push to Recycler</button>
                          ) : (
                            <span className="mute-text">Depleted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {inventory.length === 0 && !loading && (
                      <tr><td colSpan="5" className="empty-cell text-center">Warehouse is currently empty. Verify inbound loads from collectors to populate stock.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {view === 'deliveries' && (
          <section className="deliveries-view fade-in">
            <div className="view-header mb-4">
               <div>
                  <h2>Collector Intakes</h2>
                  <p className="subtitle">Evaluate and verify inbound deliveries shipped from regional collectors.</p>
               </div>
               <button className="btn-outline-primary" onClick={() => fetchData('dealer/waste-from-collectors', setWasteDeliveries)}>↻ Sync Arrivals</button>
            </div>

            <div className="card card-padding">
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Intake #ID</th>
                      <th>Collector Entity</th>
                      <th>Material Class</th>
                      <th>Recorded Payload</th>
                      <th>Arrival Time</th>
                      <th>Integrity Status</th>
                      <th>Operator Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteDeliveries.map(d => (
                      <tr key={d._id}>
                        <td className="mute-text">#{d._id.substring(0,6)}</td>
                        <td>
                          <span className="interactive-link" title="Click to view Contact Profile" onClick={() => openCollectorModal(d)}>
                            {d.collectorName} <span className="info-icon">ⓘ</span>
                          </span>
                        </td>
                        <td><span className="material-pill">{d.wasteType}</span></td>
                        <td className="strong-text">{d.quantity} kg</td>
                        <td className="mute-text">{new Date(d.date).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${d.status === 'Verified' ? 'sb-green' : 'sb-yellow'}`}>
                             {d.status}
                          </span>
                        </td>
                        <td>
                          {d.status !== 'Verified' ? (
                            <button className="btn-accept sm-btn" onClick={() => handleVerify(d._id)}>✓ Pass Integrity Check</button>
                          ) : (
                            <span className="text-success"><span className="icon">✓</span> Archived</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {wasteDeliveries.length === 0 && !loading && (
                      <tr><td colSpan="7" className="empty-cell text-center">No transport intakes recorded in history.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {view === 'transactions' && (
          <section className="transactions-view fade-in">
            <div className="view-header mb-4">
               <div>
                  <h2>Outbound Logistics (Recyclers)</h2>
                  <p className="subtitle">Audit loop closures and batch orders executed with Industrial Recyclers.</p>
               </div>
               <button className="btn-outline-primary" onClick={() => fetchData('dealer/transactions', setTransactions)}>↻ Sync Ledgers</button>
            </div>

            <div className="card card-padding">
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Contract ID</th>
                      <th>Recycler Identity</th>
                      <th>Material Subject</th>
                      <th>Freight Extracted</th>
                      <th>Capital Ingress</th>
                      <th>Contract Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t._id}>
                        <td className="mute-text">#{t._id.substring(0,8)}</td>
                        <td>
                           <span className="interactive-link" title="Click to view Purchasing Entity details" onClick={() => openRecyclerModal(t)}>
                             {t.recyclerName} <span className="info-icon">ⓘ</span>
                           </span>
                        </td>
                        <td><span className="material-pill">{t.wasteType}</span></td>
                        <td className="strong-text">{t.quantity} kg</td>
                        <td className="text-success strong-text">₹ {t.price}</td>
                        <td className="mute-text">{new Date(t.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && !loading && (
                      <tr><td colSpan="6" className="empty-cell text-center">No outbound contracts yet formed with Recyclers.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {view === 'settings' && (
           <section className="settings-section fade-in">
             <div className="view-header mb-4">
              <div>
                <h2>Dealer Regional Profile</h2>
                 <p className="subtitle">Alter internal locators and warehouse parameters.</p>
              </div>
            </div>
            <form className="card card-padding" onSubmit={handleProfileUpdate}>
              <div className="form-two-col">
                <div className="form-pane">
                  <h3 className="pane-title">Personal Specs</h3>
                  <div className="form-group">
                    <label>Dealer Executive</label>
                    <input type="text" className="input-modern" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Warehouse Hard Limit (kg)</label>
                    <input type="number" className="input-modern" value={profile.storageCapacity || ''} onChange={e => setProfile({...profile, storageCapacity: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Platform Identifier</label>
                    <input type="text" className="input-modern system-lock" value="Scrap Dealer Node" disabled />
                  </div>
                </div>

                <div className="form-pane">
                  <h3 className="pane-title">Mapping Vectors</h3>
                  <div className="form-group">
                    <label>Structural Segment (Area)</label>
                    <input type="text" className="input-modern" value={profile.area || ''} onChange={e => setProfile({...profile, area: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>District Hub</label>
                    <input type="text" className="input-modern" value={profile.district || ''} onChange={e => setProfile({...profile, district: e.target.value})} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>State Extent</label>
                      <input type="text" className="input-modern" value={profile.state || ''} onChange={e => setProfile({...profile, state: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Sovereign Tag</label>
                      <input type="text" className="input-modern" value={profile.country || ''} onChange={e => setProfile({...profile, country: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-footer mt-4">
                <button type="submit" className="btn-primary form-submit-btn" disabled={loading}>
                  {loading ? 'Processing Protocol...' : 'Finalize Profile Integrity'}
                </button>
                {updateMsg && <span className="msg-success ml-3">{updateMsg}</span>}
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

export default DealerDashboard;
