import React, { useState, useEffect } from 'react';
import './PickupWizard.css';
import { userAPI } from '../api';
import UserMapComponent from './UserMapComponent';

const PickupWizard = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [wasteType, setWasteType] = useState('');
  const [details, setDetails] = useState({ quantity: '', address: '', time: '' });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude]
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to a central point if GPS fails, but let user pin it
          setLocation({ type: 'Point', coordinates: [77.5946, 12.9716] });
        }
      );
    }
  }, []);

  const handleMapClick = (coords) => {
    setLocation({
      type: 'Point',
      coordinates: coords
    });
  };

  const categories = [
    { id: 'plastic', name: 'Plastic', img: 'https://www.bra.org/wp-content/uploads/page-plasticbottles.jpg' },
    { id: 'paper', name: 'Paper', img: 'https://images.unsplash.com/photo-1583521214690-73421a1829a9?q=80&w=400&auto=format&fit=crop' },
    { id: 'metal', name: 'Metal', img: 'https://www.morincorp.com/content/dam/morin/images/design-options-natural-metals.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg' },
    { id: 'ewaste', name: 'E-waste', img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=400&auto=format&fit=crop' },
    { id: 'glass', name: 'Glass', img: 'https://cdn.pixabay.com/photo/2014/12/12/22/08/glass-565914_1280.jpg' },
    { id: 'mixed', name: 'Mixed Waste', img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=400&auto=format&fit=crop' },
  ];

  const dealers = [
    { id: 1, name: 'Eco-Friendly Scraps', distance: '1.2 km', rating: 4.8, price: '₹ 15/kg' },
    { id: 2, name: 'GreenRecycle Hub', distance: '2.5 km', rating: 4.5, price: '₹ 14/kg' },
    { id: 3, name: 'Quick Collect Scraps', distance: '3.1 km', rating: 4.2, price: '₹ 16/kg' },
  ];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => {
    if (step === 1) onCancel();
    else setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await userAPI.createPickup({
        wasteType,
        quantity: details.quantity,
        pickupAddress: details.address,
        location: location
      });
      setStep(4);
    } catch (error) {
      console.error('Failed to create pickup request:', error);
      alert('Failed to create pickup request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pickup-wizard container">
      <div className="wizard-header">
        <button className="btn-back" onClick={handleBack}>←</button>
        <h2>Step {step} of 4</h2>
      </div>

      {step === 1 && (
        <div className="wizard-step">
          <h3>Choose waste category</h3>
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-card ${wasteType === cat.id ? 'active' : ''}`}
                onClick={() => { setWasteType(cat.id); handleNext(); }}
              >
                <div className="category-img-container">
                  <img src={cat.img} alt={cat.name} className="category-img" />
                </div>
                <span className="category-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <h3>Waste Details & Location</h3>
          
          <div className="form-group">
            <label>Confirm Pickup Location</label>
            <div className="mini-map-container">
              {location ? (
                <UserMapComponent 
                  userLocation={location.coordinates} 
                  isSelectionMode={true}
                  onLocationSelect={handleMapClick}
                />
              ) : <p>Loading map...</p>}
            </div>
            <p className="map-hint">Click on map to adjust your pin 📍</p>
          </div>

          <div className="form-group">
            <label>Estimated Quantity (kg)</label>
            <input 
              type="number" 
              placeholder="e.g. 5"
              value={details.quantity}
              onChange={(e) => setDetails({...details, quantity: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Pickup Address (Landmark/Door No)</label>
            <textarea 
              placeholder="Enter landmarks or flat number"
              value={details.address}
              onChange={(e) => setDetails({...details, address: e.target.value})}
            ></textarea>
          </div>

          <button className="btn-next" onClick={handleNext} disabled={!wasteType || !details.quantity || !details.address}>Find Dealers</button>
        </div>
      )}

      {step === 3 && (
        <div className="wizard-step">
          <h3>Match with a Dealer</h3>
          <div className="dealer-list">
            {dealers.map((dealer) => (
              <div key={dealer.id} className="dealer-card">
                <div className="dealer-info">
                  <h4>{dealer.name}</h4>
                  <p>{dealer.distance} • ⭐ {dealer.rating}</p>
                </div>
                <div className="dealer-action">
                  <span className="dealer-price">{dealer.price}</span>
                  <button className="btn-select" onClick={handleSubmit} disabled={loading}>{loading ? '...' : 'Select'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="wizard-step confirmation">
          <div className="success-icon">✅</div>
          <h3>Request Sent Successfully!</h3>
          <p>A collector in your area has been notified.</p>
          <button className="btn-done" onClick={onComplete}>Back to Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default PickupWizard;
