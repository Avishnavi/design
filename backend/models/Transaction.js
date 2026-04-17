const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  scrapDealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapDealer', required: true },
  recyclerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recycler', required: true },
  wasteType: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Purchased', 'Processing', 'Recycled'], 
    default: 'Purchased' 
  },
  transactionDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
