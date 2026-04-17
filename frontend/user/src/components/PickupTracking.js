import React from 'react';
import './PickupTracking.css';
import UserMapComponent from './UserMapComponent';

const PickupTracking = ({ pickup, onBack, hideHeader = false }) => {
  const statusMap = {
    'Pending': 1,
    'Assigned': 2,
    'On The Way': 3,
    'Collected': 4,
    'SentToDealer': 5,
    'Recycled': 5
  };

  const currentStatus = statusMap[pickup?.status] || 1;
  const collector = pickup?.assignedCollector;
  const collectorUser = collector?.user;

  const steps = [
    { id: 1, label: 'Request Sent', description: 'Your request is being matched.' },
    { id: 2, label: 'Collector Assigned', description: collectorUser ? `${collectorUser.name} is on the job.` : 'Finding a nearby collector.' },
    { id: 3, label: 'On the Way', description: 'Collector is heading to your location.' },
    { id: 4, label: 'Waste Picked Up', description: 'Collector is processing your items.' },
    { id: 5, label: 'Completed', description: 'Earnings added to your wallet.' },
  ];

  return (
    <div className={`pickup-tracking ${!hideHeader ? 'container' : ''}`}>
      {!hideHeader && (
        <div className="tracking-header">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <h2>Track Pickup</h2>
        </div>
      )}

      {/* Show Live Map if locations are available */}
      {pickup?.location?.coordinates ? (
          <UserMapComponent 
            userLocation={pickup.location.coordinates}
            collectorLocation={collector?.location?.coordinates || [77.5946, 12.9716]}
          />
      ) : (
          <div className="map-placeholder card">
            <p>📍 Location data loading...</p>
          </div>
      )}

      {collectorUser ? (
        <div className="dealer-active-card card">
          <div className="dealer-avatar">🚚</div>
          <div className="dealer-details">
            <h4>{collectorUser.name}</h4>
            <p>Verified Collector • {collectorUser.phone}</p>
          </div>
          <button className="btn-call" onClick={() => window.open(`tel:${collectorUser.phone}`)}>📞</button>
        </div>
      ) : (
        <div className="dealer-active-card card searching">
          <div className="dealer-avatar">⏳</div>
          <div className="dealer-details">
            <h4>Searching...</h4>
            <p>We are matching you with a nearby collector.</p>
          </div>
        </div>
      )}

      <div className="stepper">
        {steps.map((step) => (
          <div key={step.id} className={`step-item ${currentStatus >= step.id ? 'active' : ''} ${currentStatus === step.id ? 'current' : ''}`}>
            <div className="step-marker">
              {currentStatus > step.id ? '✓' : step.id}
            </div>
            <div className="step-content">
              <h4>{step.label}</h4>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PickupTracking;
