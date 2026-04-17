import React from 'react';
import './PickupHistory.css';

const PickupHistory = ({ history, onTrack }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'recycled':
      case 'senttodealer':
        return '#27ae60';
      case 'pending':
        return '#f39c12';
      case 'cancelled':
        return '#e74c3c';
      case 'accepted':
        return '#2980b9';
      default:
        return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="pickup-history container">
      <div className="history-header">
        <h2>My Pickup History</h2>
        <p>You've completed {history.length} pickups so far!</p>
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="empty-history card">
            <span className="empty-icon">📭</span>
            <p>No history yet. Start recycling today!</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item._id} className="history-item-card card">
              <div className="history-item-left">
                <div className="waste-type-icon">
                  {item.wasteType === 'Plastic' ? '🥤' : 
                   item.wasteType === 'Paper' ? '📄' : 
                   item.wasteType === 'Metal' ? '⚙️' : 
                   item.wasteType === 'Electronic' ? '💻' : '📦'}
                </div>
                <div className="item-details">
                  <h4>{item.wasteType}</h4>
                  <p className="item-date">{formatDate(item.createdAt)}</p>
                </div>
              </div>
              <div className="history-item-right">
                <div className="item-qty">{item.quantity} kg</div>
                <div 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(item.status) + '15', color: getStatusColor(item.status) }}
                >
                  {item.status}
                </div>
                {item.status !== 'Recycled' && item.status !== 'Cancelled' && (
                  <button className="btn-track-mini" onClick={() => onTrack(item)}>
                    Track
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PickupHistory;
