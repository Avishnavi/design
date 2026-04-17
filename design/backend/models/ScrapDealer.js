const mongoose = require('mongoose');

const scrapDealerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dealerName: { type: String, required: true }, // Can be Business Name
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  acceptedWasteTypes: [{ type: String }],
  storageCapacity: { type: Number, required: true },
  currentInventory: { type: Number, default: 0 }
});

module.exports = mongoose.model('ScrapDealer', scrapDealerSchema);
