const ScrapDealer = require('../models/ScrapDealer');
const Transaction = require('../models/Transaction');
const Inventory = require('../models/Inventory');
const WasteDelivery = require('../models/WasteDelivery');
const Recycler = require('../models/Recycler');
const Collector = require('../models/Collector');
const User = require('../models/User');
const { notifyRecyclers } = require('../services/matchingService');

// @desc    Get dashboard stats
// @route   GET /api/dealer/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const dealer = await ScrapDealer.findOne({ user: req.user.id });
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });

    const inventory = await Inventory.find({ scrapDealerId: dealer._id });
    const totalInventory = inventory.reduce((acc, item) => acc + item.quantity, 0);
    
    const transactions = await Transaction.find({ scrapDealerId: dealer._id });
    const totalEarnings = transactions.reduce((acc, t) => acc + (t.price * t.quantity), 0);

    res.json({
      success: true,
      data: {
        totalInventory,
        totalEarnings,
        storageCapacity: dealer.storageCapacity,
        currentLoad: totalInventory,
        batchCount: inventory.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get inventory ledger
// @route   GET /api/dealer/inventory
const getInventory = async (req, res) => {
  try {
    const dealer = await ScrapDealer.findOne({ user: req.user.id });
    const inventory = await Inventory.find({ scrapDealerId: dealer._id });
    
    // Transform for frontend expectation: { type, stock, grade, value }
    const formatted = inventory.map(item => ({
      _id: item._id,
      type: item.wasteType,
      stock: item.quantity,
      grade: item.qualityGrade,
      value: item.quantity * 10 // Mock value
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get waste from collectors
// @route   GET /api/dealer/waste-from-collectors
const getWasteFromCollectors = async (req, res) => {
  try {
    const dealer = await ScrapDealer.findOne({ user: req.user.id });
    const deliveries = await WasteDelivery.find({ scrapDealerId: dealer._id })
      .populate({
        path: 'collectorId',
        model: 'Collector',
        populate: { 
          path: 'user', 
          model: 'User',
          select: 'name phone email' 
        }
      })
      .sort({ deliveryDate: -1 });

    const formatted = deliveries.map(d => ({
      _id: d._id,
      collectorName: d.collectorId?.user?.name || 'Unknown Collector',
      collectorPhone: d.collectorId?.user?.phone || 'Not Available',
      collectorEmail: d.collectorId?.user?.email || 'Not Available',
      wasteType: d.wasteType,
      quantity: d.quantity,
      date: d.deliveryDate,
      status: d.status
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Verify waste and add to inventory
// @route   POST /api/dealer/verify-waste
const verifyWaste = async (req, res) => {
  try {
    const { deliveryId } = req.body;
    const delivery = await WasteDelivery.findById(deliveryId);
    
    if (!delivery || delivery.status === 'Verified') {
      return res.status(400).json({ success: false, message: 'Invalid or already verified delivery' });
    }

    // 1. Update delivery status
    delivery.status = 'Verified';
    delivery.verifiedDate = Date.now();
    await delivery.save();

    // 2. Add to Inventory
    let item = await Inventory.findOne({ 
      scrapDealerId: delivery.scrapDealerId, 
      wasteType: delivery.wasteType 
    });

    if (item) {
      item.quantity += delivery.quantity;
      item.updatedAt = Date.now();
      await item.save();
    } else {
      await Inventory.create({
        scrapDealerId: delivery.scrapDealerId,
        wasteType: delivery.wasteType,
        quantity: delivery.quantity
      });
    }

    // 3. Update Dealer Load
    const dealer = await ScrapDealer.findById(delivery.scrapDealerId);
    dealer.currentLoad += delivery.quantity;
    await dealer.save();

    res.json({ success: true, message: 'Waste verified and added to inventory' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Sell scrap to Recycler
// @route   POST /api/dealer/sell-to-recycler
const sellToRecycler = async (req, res) => {
  try {
    const { recyclerId, wasteType, quantity, price } = req.body;
    const dealer = await ScrapDealer.findOne({ user: req.user.id });

    const inventoryItem = await Inventory.findOne({ 
      scrapDealerId: dealer._id, 
      wasteType: wasteType 
    });

    if (!inventoryItem || inventoryItem.quantity < quantity) {
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
    inventoryItem.quantity -= quantity;
    inventoryItem.updatedAt = Date.now();
    await inventoryItem.save();

    // Update dealer total load
    dealer.currentLoad -= quantity;
    await dealer.save();

    res.status(201).json({ success: true, message: 'Sale successful', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get transactions
// @route   GET /api/dealer/transactions
const getTransactions = async (req, res) => {
  try {
    const dealer = await ScrapDealer.findOne({ user: req.user.id });
    const transactions = await Transaction.find({ scrapDealerId: dealer._id })
      .populate({
        path: 'recyclerId',
        populate: { path: 'user', select: 'name email phone' }
      })
      .sort({ transactionDate: -1 });

    const formatted = transactions.map(t => ({
      _id: t._id,
      recyclerName: t.recyclerId?.companyName || t.recyclerId?.user?.name || 'Unknown Recycler',
      recyclerEmail: t.recyclerId?.user?.email || 'N/A',
      recyclerPhone: t.recyclerId?.user?.phone || 'N/A',
      companyArea: t.recyclerId?.area || 'N/A',
      wasteType: t.wasteType,
      quantity: t.quantity,
      price: t.price,
      date: t.transactionDate
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update dealer profile
// @route   PUT /api/dealer/update-profile
// @access  Private (Scrap Dealer)
const updateDealerProfile = async (req, res) => {
  try {
    const dealer = await ScrapDealer.findOne({ user: req.user.id });
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });

    // Update ScrapDealer document
    dealer.dealerName = req.body.name || dealer.dealerName;
    if (req.body.location) dealer.location = req.body.location;
    dealer.area = req.body.area || dealer.area;
    dealer.district = req.body.district || dealer.district;
    dealer.state = req.body.state || dealer.state;
    dealer.country = req.body.country || dealer.country;
    dealer.storageCapacity = req.body.storageCapacity || dealer.storageCapacity;
    dealer.acceptedWasteTypes = req.body.acceptedWasteTypes || dealer.acceptedWasteTypes;

    await dealer.save();

    // Sync with User document
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

    res.json({ success: true, message: 'Dealer profile updated successfully', data: dealer });
  } catch (error) {
    console.error('Update Dealer Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getDashboardStats,
  getInventory,
  getWasteFromCollectors,
  verifyWaste,
  sellToRecycler,
  getTransactions,
  updateDealerProfile
};
