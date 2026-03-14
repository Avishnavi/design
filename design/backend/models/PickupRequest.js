const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wasteType: { type: String, required: true },
  quantity: { type: Number, required: true }, // e.g., in kg
  pickupAddress: { type: String, required: true },
  location: { // geospatial for radius search
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  status: {
    type: String,
    default: 'Pending'
  },
  assignedCollector: { type: mongoose.Schema.Types.ObjectId, ref: 'Collector' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);
