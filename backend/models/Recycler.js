const mongoose = require('mongoose');

const recyclerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  acceptedMaterials: [{ type: String }],
  maxPurchaseCapacity: { type: Number, required: true },
  isApproved: { type: Boolean, default: false }
});

module.exports = mongoose.model('Recycler', recyclerSchema);
