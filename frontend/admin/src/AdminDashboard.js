import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('overview'); // overview, users, collectors, dealers, recyclers, pickups
  const [stats, setStats] = useState(null);
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (endpoint, setter) => {
    setLoading(true);
    try {
       const token = localStorage.getItem('token') || '';
       const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/${endpoint}`, {
         headers: { 'Authorization': `Bearer ${token}` }
       });
       if (!res.ok) throw new Error('Data fetch failed');
       const result = await res.json();
       setter(result.data);
    } catch (err) {
       console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeView === 'overview') fetchData('dashboard', setStats);
    else if (activeView === 'users') fetchData('all-users', setDataList);
    else if (activeView === 'collectors') fetchData('all-collectors', setDataList);
    else if (activeView === 'dealers') fetchData('all-dealers', setDataList);
    else if (activeView === 'recyclers') fetchData('all-recyclers', setDataList);
    else if (activeView === 'pickups') fetchData('all-pickups', setDataList);
  }, [activeView, fetchData]);

  const handleDeleteUser = async (id) => {
    if(!window.confirm("Are you sure you want to completely erase this user profile and all attached entities from the database?")) return;
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/user/${id}`, { method: 'DELETE' });
      fetchData('all-users', setDataList);
    } catch(err) { console.error(err); }
  };

  const handleToggleCollector = async (id) => {
    try {
       await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/toggle-collector/${id}`, { method: 'PUT' });
       fetchData('all-collectors', setDataList);
    } catch(err) { console.error(err); }
  }

  const handleToggleDealer = async (id) => {
    try {
       await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/approve-dealer/${id}`, { method: 'PUT' });
       fetchData('all-dealers', setDataList);
    } catch(err) { console.error(err); }
  }

  const handleToggleRecycler = async (id) => {
    try {
       await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/approve-recycler/${id}`, { method: 'PUT' });
       fetchData('all-recyclers', setDataList);
    } catch(err) { console.error(err); }
  }

  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <div className="admin-logo">⛑️ <span className="logo-text">System Admin</span></div>
        <div className="nav-group">
          <small>GLOBAL METRICS</small>
          <button className={activeView === 'overview' ? 'active' : ''} onClick={() => setActiveView('overview')}>Dashboard Overview</button>
        </div>
        <div className="nav-group">
          <small>ENTITIES</small>
          <button className={activeView === 'users' ? 'active' : ''} onClick={() => setActiveView('users')}>Users Core Registry</button>
          <button className={activeView === 'collectors' ? 'active' : ''} onClick={() => setActiveView('collectors')}>Collector Network</button>
          <button className={activeView === 'dealers' ? 'active' : ''} onClick={() => setActiveView('dealers')}>Scrap Dealers</button>
          <button className={activeView === 'recyclers' ? 'active' : ''} onClick={() => setActiveView('recyclers')}>Industrial Recyclers</button>
        </div>
        <div className="nav-group">
          <small>LIFECYCLE TRACT</small>
          <button className={activeView === 'pickups' ? 'active' : ''} onClick={() => setActiveView('pickups')}>Pickup Request Tree</button>
        </div>
      </nav>

      <main className="admin-main">
        <header className="admin-header">
          <h1>{activeView.toUpperCase()} MATRIX</h1>
          <div className="system-status">Network Status: <span className="health-online">ONLINE INTEGRITY SECURE</span></div>
        </header>

        {loading && <p className="loading-state">Syncing backend databanks...</p>}

        {activeView === 'overview' && stats && (
          <div className="overview-container fade-in">
            <div className="overview-grid">
              <div className="admin-stat-card card">
                <span>Total User Base</span>
                <h2>{stats.totalUsers}</h2>
              </div>
              <div className="admin-stat-card card">
                <span>Active Collectors</span>
                <h2>{stats.totalCollectors}</h2>
              </div>
              <div className="admin-stat-card card">
                <span>Dealers Network</span>
                <h2>{stats.totalDealers}</h2>
              </div>
              <div className="admin-stat-card card">
                <span>Recycler Logistics</span>
                <h2>{stats.totalRecyclers}</h2>
              </div>
            </div>
            
            <h3 className="section-title mt-4" style={{marginTop:'30px', marginBottom: '15px'}}>Supply Chain Global View</h3>
            <div className="overview-grid">
              <div className="admin-stat-card card bg-indigo">
                <span style={{color: '#c7d2fe'}}>Total Global Logistics Formed</span>
                <h2 style={{color: 'white'}}>{stats.totalPickups} Requests</h2>
              </div>
              <div className="admin-stat-card card bg-success">
                <span style={{color: '#bbf7d0'}}>Successful Full Lifecycle Cycles</span>
                <h2 style={{color: 'white'}}>{stats.completedRecycling} Concluded</h2>
              </div>
              <div className="admin-stat-card card bg-warning">
                <span style={{color: '#fef08a'}}>In-Flight Regional Logistics</span>
                <h2 style={{color: 'white'}}>{stats.activeRequests} Pending</h2>
              </div>
               <div className="admin-stat-card card bg-metallic">
                <span style={{color: '#e2e8f0'}}>Aggregate Material Defeated</span>
                <h2 style={{color: 'white'}}>{stats.totalRecycledMaterials} kg Processed</h2>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeView === 'users' && !loading && (
          <div className="card admin-table-container fade-in">
            <table className="admin-table">
              <thead><tr><th>ID Hash</th><th>Full Name</th><th>Email Access Base</th><th>Architect Role</th><th>Action</th></tr></thead>
              <tbody>
                {dataList.map(u => (
                  <tr key={u._id}>
                     <td className="mute-text">{(u._id).substring(0,8)}</td>
                     <td className="strong-text">{u.name}</td>
                     <td>{u.email}</td>
                     <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                     <td><button className="btn-reject sm-btn w-100" onClick={() => handleDeleteUser(u._id)}>Eradicate User</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* COLLECTORS */}
        {activeView === 'collectors' && !loading && (
          <div className="card admin-table-container fade-in">
            <table className="admin-table">
              <thead><tr><th>Network Hash</th><th>Linked Profile Identity</th><th>Database Status</th><th>Regional Mapping</th><th>Security Auth Action</th></tr></thead>
              <tbody>
                {dataList.map(c => (
                  <tr key={c._id}>
                     <td className="mute-text">{(c._id).substring(0,8)}</td>
                     <td><strong>{c.user?.name}</strong> <br/><small className="mute-text">{c.user?.email}</small></td>
                     <td>
                        <span className={`status-pill ${c.isActive ? 'active-pill' : 'inactive-pill'}`}>
                           {c.isActive ? 'Linked Active' : 'Suspended Node'}
                        </span>
                     </td>
                     <td>{c.area || 'Unassigned Sector'} / {c.district || 'Unassigned City'}</td>
                     <td>
                        <button className={`btn-${c.isActive ? 'reject' : 'approve'} sm-btn w-100`} onClick={() => handleToggleCollector(c._id)}>
                           {c.isActive ? 'Suspend Agent Pipeline' : 'Restore System Access'}
                        </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DEALERS */}
        {activeView === 'dealers' && !loading && (
          <div className="card admin-table-container fade-in">
            <table className="admin-table">
              <thead><tr><th>Entity ID</th><th>Dealer Registration</th><th>Owner Exec.</th><th>Load Structure Limit</th><th>Legal Approval Gate</th></tr></thead>
              <tbody>
                {dataList.map(d => (
                  <tr key={d._id}>
                     <td className="mute-text">{(d._id).substring(0,8)}</td>
                     <td><strong>{d.dealerName}</strong> <br/><small className="mute-text">{d.area}</small></td>
                     <td>{d.user?.name} <br/><small className="mute-text">{d.user?.email}</small></td>
                     <td><span className="strong-text">{d.inventory?.reduce((acc, i) => acc + i.quantity, 0)} kg</span> / {d.storageCapacity} max limit</td>
                     <td>
                        <button className={`btn-${d.isApproved ? 'reject' : 'approve'} sm-btn w-100`} onClick={() => handleToggleDealer(d._id)}>
                           {d.isApproved ? '✓ CERTIFIED (Revoke)' : '✗ PENDING (Approve)'}
                        </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RECYCLERS */}
        {activeView === 'recyclers' && !loading && (
          <div className="card admin-table-container fade-in">
            <table className="admin-table">
              <thead><tr><th>Entity Hash</th><th>Industrial Org Registration</th><th>Owner Pipeline</th><th>Procurement Throttle Max</th><th>Legal Approval Gate</th></tr></thead>
              <tbody>
                {dataList.map(r => (
                  <tr key={r._id}>
                     <td className="mute-text">{(r._id).substring(0,8)}</td>
                     <td><strong className="text-success">{r.companyName}</strong></td>
                     <td>{r.user?.name} <br/><small className="mute-text">{r.user?.email}</small></td>
                     <td>{r.maxPurchaseCapacity} kg limit threshold</td>
                     <td>
                        <button className={`btn-${r.isApproved ? 'reject' : 'approve'} sm-btn w-100`} onClick={() => handleToggleRecycler(r._id)}>
                           {r.isApproved ? '✓ CERTIFIED (Revoke)' : '✗ PENDING (Approve)'}
                        </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PICKUPS */}
        {activeView === 'pickups' && !loading && (
           <div className="card admin-table-container fade-in">
            <table className="admin-table">
              <thead><tr><th>Log Trace Hash</th><th>Genesis Node</th><th>Logistics Path Vectors</th><th>Pipeline Status Phase</th><th>Asset Size</th></tr></thead>
              <tbody>
                {dataList.map(p => (
                  <tr key={p._id}>
                     <td className="mute-text">{(p._id).substring(0,8)}</td>
                     <td className="strong-text">{p.userId?.name || 'Unknown'}</td>
                     <td>
                        <strong>CT (Logistics Collector):</strong> {p.assignedCollector?.user?.name || 'Orphan Node - Unassigned'} <br/>
                        <strong>DL (Logistics Dealer):</strong> {p.assignedDealer?.dealerName || 'Unresolved Hub Node'}
                     </td>
                     <td>
                        <span className={`role-pill ${(p.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                           {p.status || 'Pending'}
                        </span>
                     </td>
                     <td><span className="strong-text">{p.quantity} kg</span> [{p.wasteType}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
