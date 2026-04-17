const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  scrapDealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapDealer', required: true },
  wasteType: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  qualityGrade: { type: String, enum: ['A', 'B', 'C', 'N/A'], default: 'N/A' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inventory', inventorySchema);
