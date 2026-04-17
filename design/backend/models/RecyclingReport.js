const mongoose = require('mongoose');

const recyclingReportSchema = new mongoose.Schema({
  recycler: { type: mongoose.Schema.Types.ObjectId, ref: 'Recycler', required: true },
  materialType: { type: String, required: true },
  quantityRecycled: { type: Number, required: true }, // in kg
  efficiency: { type: Number }, // e.g., percentage recycled
  date: { type: Date, default: Date.now },
  notes: { type: String }
});

module.exports = mongoose.model('RecyclingReport', recyclingReportSchema);
