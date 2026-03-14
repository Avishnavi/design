const ScrapDealer = require('../models/ScrapDealer');
const Transaction = require('../models/Transaction');
const { notifyRecyclers } = require('../services/matchingService');

// @desc    Get scrap inventory
// @route   GET /api/dealer/inventory
// @access  Private (Scrap Dealer)
const getInventory = async (req, res) => {
  try {
    const dealer = await ScrapDealer.findOne({ user: req.user.id });
    if (!dealer) {
      return res.status(404).json({ success: false, message: 'Dealer profile not found' });
    }
    res.json({ success: true, inventory: dealer.currentInventory, capacity: dealer.storageCapacity });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Add waste to inventory (from collector)
// @route   POST /api/dealer/add-waste
// @access  Private (Scrap Dealer)
const addWaste = async (req, res) => {
  try {
    const { wasteType, quantity } = req.body;

    const dealer = await ScrapDealer.findOne({ user: req.user.id });
    
    // Update inventory
    dealer.currentInventory += quantity;
    if (!dealer.acceptedWasteTypes.includes(wasteType)) {
        dealer.acceptedWasteTypes.push(wasteType);
    }
    await dealer.save();

    // Notify recyclers if inventory is high
    if (dealer.currentInventory > 100) { 
        await notifyRecyclers(dealer, wasteType, dealer.currentInventory);
    }

    res.status(200).json({ success: true, message: 'Waste added to inventory', inventory: dealer.currentInventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Sell scrap to Recycler
// @route   POST /api/dealer/sell-to-recycler
// @access  Private (Scrap Dealer)
const sellToRecycler = async (req, res) => {
  try {
    const { recyclerId, wasteType, quantity, price } = req.body;
    
    const dealer = await ScrapDealer.findOne({ user: req.user.id });

    if (dealer.currentInventory < quantity) {
        return res.status(400).json({ success: false, message: 'Insufficient inventory' });
    }

    // Create transaction
    const transaction = await Transaction.create({
        scrapDealerId: dealer._id,
        recyclerId: recyclerId,
        wasteType,
        quantity,
        price,
        transactionDate: Date.now()
    });

    // Deduct from inventory
    dealer.currentInventory -= quantity;
    await dealer.save();

    res.status(201).json({ success: true, message: 'Sale successful', transaction });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getInventory,
  addWaste,
  sellToRecycler
};
