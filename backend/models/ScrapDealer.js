const mongoose = require('mongoose');

const scrapDealerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dealerName: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  country: { type: String, default: '' },
  state: { type: String, default: '' },
  district: { type: String, default: '' },
  area: { type: String, default: '' },
  acceptedWasteTypes: [{ type: String }],
  storageCapacity: { type: Number, required: true },
  inventory: [{
    wasteType: { type: String, required: true },
    quantity: { type: Number, default: 0 }
  }],
  isApproved: { type: Boolean, default: false }
});

module.exports = mongoose.model('ScrapDealer', scrapDealerSchema);
