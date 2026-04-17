const mongoose = require('mongoose');

const wasteMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Plastic", "Metal", "Paper"
  category: { type: String, required: true }, // e.g., "Recyclable", "Non-Recyclable"
  pricePerUnit: { type: Number, default: 0 }, // Price per kg/unit
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WasteMaterial', wasteMaterialSchema);
