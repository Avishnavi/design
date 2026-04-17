const Recycler = require('../models/Recycler');
const ScrapDealer = require('../models/ScrapDealer');
const Transaction = require('../models/Transaction');

// @desc    View available scrap from dealers
// @route   GET /api/recycler/available-scrap
// @access  Private (Recycler)
const getAvailableScrap = async (req, res) => {
  try {
    const dealers = await ScrapDealer.find({
        currentInventory: { $gt: 0 }
    }).populate('user', 'name location');

    res.json({ success: true, count: dealers.length, data: dealers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Purchase scrap (Simulated)
// @route   POST /api/recycler/buy-scrap
// @access  Private (Recycler)
const buyScrap = async (req, res) => {
  try {
    const { dealerId, wasteType, quantity, price } = req.body;
    
    const recycler = await Recycler.findOne({ user: req.user.id });
    const dealer = await ScrapDealer.findById(dealerId);

    if (!dealer || dealer.currentInventory < quantity) {
        return res.status(400).json({ success: false, message: 'Invalid dealer or insufficient inventory' });
    }

    // Create transaction
    const transaction = await Transaction.create({
        scrapDealerId: dealer._id,
        recyclerId: recycler._id,
        wasteType,
        quantity,
        price,
        transactionDate: Date.now()
    });

    // Deduct from dealer inventory
    dealer.currentInventory -= quantity;
    await dealer.save();

    res.status(201).json({ success: true, message: 'Scrap purchased successfully', transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update recycling status
// @route   POST /api/recycler/update-recycling-status
// @access  Private (Recycler)
const updateRecyclingStatus = async (req, res) => {
  try {
    // This is a placeholder for updating the status of processed waste
    const { status, batchId } = req.body;
    
    // In a real system, we'd track batches. Here we just acknowledge.
    res.status(200).json({ success: true, message: `Recycling status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAvailableScrap,
  buyScrap,
  updateRecyclingStatus
};
