const mongoose = require('mongoose');

const collectorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Name and Phone are accessible via the User model
  availabilityStatus: { type: Boolean, default: true },
  activePickupCount: { type: Number, default: 0 },
  assignedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PickupRequest' }],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  country: { type: String, default: '' },
  state: { type: String, default: '' },
  district: { type: String, default: '' },
  area: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Collector', collectorSchema);
