const Recycler = require('../models/Recycler');
const ScrapDealer = require('../models/ScrapDealer');
const Transaction = require('../models/Transaction');

// @desc    Get all recyclers
// @route   GET /api/recyclers
// @access  Private
const getAllRecyclers = async (req, res) => {
  try {
    const recyclers = await Recycler.find().populate('user', 'name email');
    res.json({ success: true, data: recyclers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    View available scrap from dealers
// @route   GET /api/recyclers/available-scrap
// @access  Private (Recycler)
const getAvailableScrap = async (req, res) => {
  try {
    const Inventory = require('../models/Inventory');
    
    // Find all inventory items with quantity > 0
    const inventoryItems = await Inventory.find({ quantity: { $gt: 0 } }).populate('scrapDealerId');

    let marketplaceItems = [];
    
    const priceMap = {
      'Plastic': 15,
      'Metal': 40,
      'Paper': 8,
      'E-waste': 120,
      'Glass': 5
    };

    inventoryItems.forEach(item => {
      if (item.scrapDealerId) {
        marketplaceItems.push({
          dealerId: item.scrapDealerId._id,
          dealerName: item.scrapDealerId.dealerName || item.scrapDealerId.name || 'Unknown Dealer',
          dealerArea: item.scrapDealerId.area || 'Unknown Area',
          wasteType: item.wasteType,
          quantity: item.quantity,
          pricePerKg: priceMap[item.wasteType] || 10
        });
      }
    });

    res.json({ success: true, count: marketplaceItems.length, data: marketplaceItems });
  } catch (error) {
    console.error('getAvailableScrap error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Purchase scrap
// @route   POST /api/recyclers/buy-scrap
// @access  Private (Recycler)
const buyScrap = async (req, res) => {
  try {
    const { dealerId, wasteType, quantity, price } = req.body;
    
    const recycler = await Recycler.findOne({ user: req.user.id });
    if (!recycler) {
      return res.status(404).json({ success: false, message: 'Recycler profile not found' });
    }

    const dealer = await ScrapDealer.findById(dealerId);
    if (!dealer) {
        return res.status(404).json({ success: false, message: 'Dealer not found' });
    }

    const Inventory = require('../models/Inventory');

    // Find the specific item in the external Inventory collection
    const inventoryItem = await Inventory.findOne({ scrapDealerId: dealer._id, wasteType: wasteType });
    
    if (!inventoryItem || inventoryItem.quantity < quantity) {
        return res.status(400).json({ success: false, message: 'Insufficient inventory at dealer' });
    }

    // Create transaction
    const transaction = await Transaction.create({
        scrapDealerId: dealer._id,
        recyclerId: recycler._id,
        wasteType,
        quantity,
        price,
        status: 'Purchased',
        transactionDate: Date.now()
    });

    // Deduct from dealer inventory
    inventoryItem.quantity -= quantity;
    await inventoryItem.save();

    res.status(201).json({ success: true, message: 'Scrap purchased successfully', transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update recycling status
// @route   POST /api/recyclers/update-recycling-status
// @access  Private (Recycler)
const updateRecyclingStatus = async (req, res) => {
  try {
    const { transactionId, status } = req.body;
    
    // Validate status
    if (!['Purchased', 'Processing', 'Recycled'].includes(status)) {
       return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    transaction.status = status;
    await transaction.save();

    res.status(200).json({ success: true, message: `Recycling status updated to ${status}`, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get dashboard metrics
// @route   GET /api/recyclers/dashboard
// @access  Private (Recycler)
const getDashboardData = async (req, res) => {
  try {
    let recycler = await Recycler.findOne({ user: req.user.id });
    
    // Auto-heal ghost accounts for recycler
    if (!recycler) {
      const User = require('../models/User');
      const userDoc = await User.findById(req.user.id);
      recycler = await Recycler.create({
        user: userDoc._id,
        companyName: userDoc.name,
        location: userDoc.location || { type: 'Point', coordinates: [0,0] },
        maxPurchaseCapacity: 10000,
        acceptedMaterials: []
      });
    }

    const transactions = await Transaction.find({ recyclerId: recycler._id }).populate('scrapDealerId', 'dealerName');

    let totalPurchased = 0;
    let totalRecycled = 0;
    let pendingMaterials = 0;

    transactions.forEach(tx => {
      totalPurchased += tx.quantity;
      if (tx.status === 'Recycled') {
         totalRecycled += tx.quantity;
      } else {
         pendingMaterials += tx.quantity;
      }
    });

    res.json({
      success: true,
      data: {
        totalPurchased,
        totalRecycled,
        pendingMaterials,
        recentTransactions: transactions.slice(-5).reverse(), // Last 5 transactions
        allTransactions: transactions.reverse()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get recycling reports
// @route   GET /api/recyclers/reports
// @access  Private (Recycler)
const getReports = async (req, res) => {
  try {
    let recycler = await Recycler.findOne({ user: req.user.id });
    if (!recycler) {
      const User = require('../models/User');
      const userDoc = await User.findById(req.user.id);
      recycler = await Recycler.create({
        user: userDoc._id,
        companyName: userDoc.name,
        location: userDoc.location || { type: 'Point', coordinates: [0,0] },
        maxPurchaseCapacity: 10000,
        acceptedMaterials: []
      });
    }

    const transactions = await Transaction.find({ recyclerId: recycler._id, status: 'Recycled' });
    
    let breakdown = {};
    let totalRecycledWeight = 0;

    transactions.forEach(tx => {
        totalRecycledWeight += tx.quantity;
        if (!breakdown[tx.wasteType]) {
            breakdown[tx.wasteType] = 0;
        }
        breakdown[tx.wasteType] += tx.quantity;
    });

    const breakdownArray = Object.keys(breakdown).map(type => ({
        type,
        quantity: breakdown[type]
    }));

    res.json({
      success: true,
      data: {
        totalRecycledWeight,
        breakdown: breakdownArray
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get recycler profile
// @route   GET /api/recyclers/profile
// @access  Private (Recycler)
const getRecyclerProfile = async (req, res) => {
  try {
    const User = require('../models/User'); 
    const user = await User.findById(req.user.id);

    let recycler = await Recycler.findOne({ user: req.user.id });
    if (!recycler) {
      recycler = await Recycler.create({
        user: user._id,
        companyName: user.name,
        location: user.location || { type: 'Point', coordinates: [0,0] },
        maxPurchaseCapacity: 10000,
        acceptedMaterials: []
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...user.toObject(),
        companyName: recycler.companyName,
        maxPurchaseCapacity: recycler.maxPurchaseCapacity,
        acceptedMaterials: recycler.acceptedMaterials,
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update recycler profile
// @route   PUT /api/recyclers/update-profile
// @access  Private (Recycler)
const updateRecyclerProfile = async (req, res) => {
  try {
    let recycler = await Recycler.findOne({ user: req.user.id });
    if (!recycler) {
      const User = require('../models/User');
      const userDoc = await User.findById(req.user.id);
      recycler = await Recycler.create({
        user: userDoc._id,
        companyName: userDoc.name,
        location: userDoc.location || { type: 'Point', coordinates: [0,0] },
        maxPurchaseCapacity: 10000,
        acceptedMaterials: []
      });
    }

    // Update Recycler document
    recycler.companyName = req.body.companyName || recycler.companyName;
    if (req.body.location) recycler.location = req.body.location;
    recycler.maxPurchaseCapacity = req.body.maxPurchaseCapacity || recycler.maxPurchaseCapacity;
    recycler.acceptedMaterials = req.body.acceptedMaterials || recycler.acceptedMaterials;

    await recycler.save();

    // Sync with User document
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.location) user.location = req.body.location;
      user.area = req.body.area || user.area;
      user.district = req.body.district || user.district;
      user.state = req.body.state || user.state;
      user.country = req.body.country || user.country;
      await user.save();
    }

    res.json({ success: true, message: 'Recycler profile updated successfully', data: recycler });
  } catch (error) {
    console.error('Update Recycler Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


module.exports = {
  getAvailableScrap,
  buyScrap,
  updateRecyclingStatus,
  getAllRecyclers,
  getDashboardData,
  getReports,
  getRecyclerProfile,
  updateRecyclerProfile
};
