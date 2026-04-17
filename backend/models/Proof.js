const mongoose = require('mongoose');

const proofSchema = new mongoose.Schema({
  pickupRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PickupRequest', required: true },
  recyclerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recycler', required: true },
  resultType: { 
    type: String, 
    enum: ['Recycled', 'Reused', 'Composted', 'EnergyRecovery', 'Rejected'], 
    required: true 
  },
  proofUrl: { type: String }, // Image or PDF URL
  processedWeight: { type: Number, required: true },
  impactMetrics: {
    co2Saved: Number, // in kg
    landfillReduction: Number, // in kg
    treesEquivalent: Number
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proof', proofSchema);
