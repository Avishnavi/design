import React, { useState, useEffect } from 'react';
import { collectorAPI } from './api';

const PickupHistory = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await collectorAPI.getPickupHistory();
        setHistory(response.data.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="pickup-history container">
      <header className="module-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h2>Pickup History</h2>
      </header>

      {loading ? (
        <p>Loading history...</p>
      ) : (
        <div className="history-list">
          {history.length === 0 ? (
            <p>No past pickups found.</p>
          ) : (
            history.map((item) => (
              <div key={item._id} className="pickup-row-card card">
                <div className="pickup-main-info">
                  <div className="pickup-loc">
                    <h4>{item.userId?.name || 'User'}</h4>
                    <p>{item.pickupAddress}</p>
                    <small>{item.wasteType} • {new Date(item.createdAt).toLocaleDateString()}</small>
                  </div>
                  <div className="pickup-status">
                    <span className={`status-tag ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PickupHistory;
