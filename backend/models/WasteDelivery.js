const mongoose = require('mongoose');

const wasteDeliverySchema = new mongoose.Schema({
  pickupRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PickupRequest', required: true },
  scrapDealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapDealer', required: true },
  collectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collector', required: true },
  wasteType: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Verified'], default: 'Pending' },
  deliveryDate: { type: Date, default: Date.now },
  verifiedDate: { type: Date }
});

module.exports = mongoose.model('WasteDelivery', wasteDeliverySchema);
