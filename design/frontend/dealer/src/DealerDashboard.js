import React, { useState } from 'react';
import './DealerDashboard.css';

const DealerDashboard = () => {
  const [view, setView] = useState('inventory'); // 'inventory', 'fleet', 'marketplace'

  // Mock Data
  const inventory = [
    { type: 'Plastic (PET)', stock: '1,250 kg', grade: 'A', value: '₹ 18,750' },
    { type: 'Iron/Steel', stock: '850 kg', grade: 'B', value: '₹ 42,500' },
    { type: 'Paper/Cardboard', stock: '2,100 kg', grade: 'A', value: '₹ 10,500' },
    { type: 'E-Waste', stock: '120 kg', grade: 'N/A', value: '₹ 24,000' },
  ];

  const fleet = [
    { name: 'Rajesh Kumar', status: 'Active (On Pickup)', location: 'Green Lane' },
    { name: 'Suresh V', status: 'Idle', location: 'Main Warehouse' },
    { name: 'Amit Singh', status: 'Active (To Warehouse)', location: 'Sea Side' },
  ];

  const marketplace = [
    { recycler: 'EcoRecycle Ltd', lookingFor: 'Plastic PET', priceOffer: '₹ 16/kg', quantity: '5 Tons' },
    { recycler: 'SteelForge Units', lookingFor: 'Iron Scraps', priceOffer: '₹ 55/kg', quantity: '2 Tons' },
  ];

  return (
    <div className="dealer-dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">🏢 Dealer Hub</div>
        <nav className="sidebar-nav">
          <button className={view === 'inventory' ? 'active' : ''} onClick={() => setView('inventory')}>📦 Inventory Ledger</button>
          <button className={view === 'fleet' ? 'active' : ''} onClick={() => setView('fleet')}>🚚 Fleet Management</button>
          <button className={view === 'marketplace' ? 'active' : ''} onClick={() => setView('marketplace')}>🤝 Marketplace</button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h2>{view === 'inventory' ? 'Inventory Overview' : view === 'fleet' ? 'Live Fleet Status' : 'Bulk Sales Marketplace'}</h2>
          <div className="header-actions">
            <button className="btn-primary">+ Create Dispatch</button>
            <button className="btn-secondary">Export CSV</button>
          </div>
        </header>

        {view === 'inventory' && (
          <section className="inventory-section">
            <div className="stats-row">
              <div className="stat-box card">
                <span>Total Stock</span>
                <h3>4,320 kg</h3>
              </div>
              <div className="stat-box card">
                <span>Total Value</span>
                <h3>₹ 95,750</h3>
              </div>
            </div>
            <table className="data-table card">
              <thead>
                <tr>
                  <th>Material Type</th>
                  <th>Total Stock</th>
                  <th>Grading</th>
                  <th>Estimated Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.type}</strong></td>
                    <td>{item.stock}</td>
                    <td><span className="grade-badge">{item.grade}</span></td>
                    <td>{item.value}</td>
                    <td><button className="btn-table">Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {view === 'fleet' && (
          <section className="fleet-section">
            <div className="fleet-grid">
              {fleet.map((c, idx) => (
                <div key={idx} className="fleet-card card">
                  <div className="fleet-avatar">👤</div>
                  <div className="fleet-info">
                    <h4>{c.name}</h4>
                    <p>{c.location}</p>
                    <span className={`status-tag ${c.status.toLowerCase().includes('idle') ? 'idle' : 'active'}`}>{c.status}</span>
                  </div>
                  <button className="btn-assign">Dispatch</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'marketplace' && (
          <section className="marketplace-section">
            <div className="offers-list">
              {marketplace.map((offer, idx) => (
                <div key={idx} className="offer-card card">
                  <div className="offer-main">
                    <h4>{offer.recycler}</h4>
                    <p>Buying: <strong>{offer.lookingFor}</strong> • Min: {offer.quantity}</p>
                  </div>
                  <div className="offer-price">
                    <span>Offered Price</span>
                    <h3>{offer.priceOffer}</h3>
                  </div>
                  <button className="btn-primary">Sell Bulk Inventory</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default DealerDashboard;
