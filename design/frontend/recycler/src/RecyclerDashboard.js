import React, { useState } from 'react';
import './RecyclerDashboard.css';

const RecyclerDashboard = () => {
  const [activeTab, setActiveTab] = useState('procurement');

  const bulkOffers = [
    { id: 'OFF-001', dealer: 'City Scrap Center', material: 'PET Plastic', qty: '2.5 Tons', price: '₹ 18,000/Ton', status: 'Pending Review' },
    { id: 'OFF-002', dealer: 'Green Earth Dealers', material: 'Aluminium Bales', qty: '1.2 Tons', price: '₹ 95,000/Ton', status: 'In Transit' },
    { id: 'OFF-003', dealer: 'Metro Waste Hub', material: 'Mixed Paper', qty: '5.0 Tons', price: '₹ 8,500/Ton', status: 'Inspected' },
  ];

  const buyRequests = [
    { material: 'HDPE Plastic', targetQty: '10 Tons', fulfilled: '4.5 Tons', urgency: 'High' },
    { material: 'Copper Wire', targetQty: '500 kg', fulfilled: '120 kg', urgency: 'Medium' },
  ];

  return (
    <div className="recycler-dashboard">
      <nav className="top-nav">
        <div className="logo">🏭 RecyclerPro</div>
        <div className="nav-links">
          <button className={activeTab === 'procurement' ? 'active' : ''} onClick={() => setActiveTab('procurement')}>Procurement</button>
          <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>Buy Requests</button>
          <button className={activeTab === 'inspection' ? 'active' : ''} onClick={() => setActiveTab('inspection')}>Quality Control</button>
          <button className={activeTab === 'settlements' ? 'active' : ''} onClick={() => setActiveTab('settlements')}>Settlements</button>
        </div>
        <div className="user-profile">Recycling Unit #04</div>
      </nav>

      <div className="content-area container">
        {activeTab === 'procurement' && (
          <section className="procurement-view">
            <div className="view-header">
              <h2>Incoming Bulk Offers</h2>
              <button className="btn-primary">Browse Marketplace</button>
            </div>
            
            <div className="offers-grid">
              {bulkOffers.map(offer => (
                <div key={offer.id} className="offer-card card">
                  <div className="offer-header">
                    <span className="offer-id">{offer.id}</span>
                    <span className={`status-pill ${offer.status.toLowerCase().replace(' ', '-')}`}>{offer.status}</span>
                  </div>
                  <h3>{offer.material}</h3>
                  <div className="offer-body">
                    <p><strong>Dealer:</strong> {offer.dealer}</p>
                    <p><strong>Quantity:</strong> {offer.qty}</p>
                    <p className="price-tag">{offer.price}</p>
                  </div>
                  <div className="offer-actions">
                    <button className="btn-outline">View Lab Report</button>
                    <button className="btn-accept">Accept Offer</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'requests' && (
          <section className="requests-view">
            <div className="view-header">
              <h2>My Purchase Requests</h2>
              <button className="btn-primary">+ Create New Request</button>
            </div>
            <div className="requests-list">
              {buyRequests.map((req, idx) => (
                <div key={idx} className="request-item card">
                  <div className="req-info">
                    <h4>{req.material}</h4>
                    <p>Urgency: <span className={`urgency-${req.urgency.toLowerCase()}`}>{req.urgency}</span></p>
                  </div>
                  <div className="req-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(parseFloat(req.fulfilled)/parseFloat(req.targetQty))*100}%` }}></div>
                    </div>
                    <span>{req.fulfilled} / {req.targetQty} Fulfilled</span>
                  </div>
                  <button className="btn-edit">Edit</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'inspection' && (
          <section className="inspection-view card">
            <h2>Quality Inspection Log</h2>
            <table className="inspection-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Material</th>
                  <th>Impurity %</th>
                  <th>Grade Assigned</th>
                  <th>Inspector</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#B-9921</td>
                  <td>PET Flakes</td>
                  <td>0.2%</td>
                  <td><strong>Grade A+</strong></td>
                  <td>Dr. Aris</td>
                  <td><span className="pass">PASSED</span></td>
                </tr>
                <tr>
                  <td>#B-9922</td>
                  <td>Cardboard</td>
                  <td>4.5%</td>
                  <td><strong>Grade C</strong></td>
                  <td>S. Mehra</td>
                  <td><span className="warning">RE-WASH</span></td>
                </tr>
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
};

export default RecyclerDashboard;
