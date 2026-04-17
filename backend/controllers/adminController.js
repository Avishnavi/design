const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');
const Collector = require('../models/Collector');
const ScrapDealer = require('../models/ScrapDealer');
const Recycler = require('../models/Recycler');
const Transaction = require('../models/Transaction');

// @desc    Get dashboard metrics
// @route   GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCollectors = await Collector.countDocuments();
    const totalDealers = await ScrapDealer.countDocuments();
    const totalRecyclers = await Recycler.countDocuments();
    
    const pickupRequests = await PickupRequest.find();
    const totalPickups = pickupRequests.length;
    const activeRequests = pickupRequests.filter(r => r.status !== 'Completed' && r.status !== 'Recycled').length;
    const completedRecycling = pickupRequests.filter(r => r.status === 'Recycled' || r.status === 'Completed').length;
    
    // Aggregating transaction volumes for Total Recycled Materials
    const transactions = await Transaction.find();
    const totalRecycledMaterials = transactions.reduce((acc, t) => acc + t.quantity, 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCollectors,
        totalDealers,
        totalRecyclers,
        totalPickups,
        totalRecycledMaterials,
        activeRequests,
        completedRecycling
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all active users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all Collectors
const getAllCollectors = async (req, res) => {
  try {
    const collectors = await Collector.find().populate('user', 'name email phone').sort({ _id: -1 });
    res.json({ success: true, data: collectors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all Scrap Dealers
const getAllDealers = async (req, res) => {
  try {
    const dealers = await ScrapDealer.find().populate('user', 'name email phone').sort({ _id: -1 });
    res.json({ success: true, data: dealers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all Recyclers
const getAllRecyclers = async (req, res) => {
  try {
    const recyclers = await Recycler.find().populate('user', 'name email phone').sort({ _id: -1 });
    res.json({ success: true, data: recyclers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all Pickup Requests with full lifecycle tracking
const getAllPickups = async (req, res) => {
  try {
    const pickups = await PickupRequest.find()
      .populate('userId', 'name phone')
      .populate({
        path: 'assignedCollector',
        populate: { path: 'user', select: 'name phone' }
      })
      .populate('assignedDealer', 'dealerName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: pickups });
  } catch (error) {
    console.error("Pickup Fetch Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Toggle collector active status
const toggleCollector = async (req, res) => {
  try {
    const collector = await Collector.findById(req.params.id);
    if (!collector) return res.status(404).json({ success: false, message: 'Not found' });
    collector.isActive = !collector.isActive;
    await collector.save();
    res.json({ success: true, data: collector });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve/Reject Scrap Dealer
const toggleDealerApproval = async (req, res) => {
  try {
    const dealer = await ScrapDealer.findById(req.params.id);
    if (!dealer) return res.status(404).json({ success: false, message: 'Not found' });
    dealer.isApproved = !dealer.isApproved;
    await dealer.save();
    res.json({ success: true, data: dealer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve/Reject Recycler
const toggleRecyclerApproval = async (req, res) => {
  try {
    const recycler = await Recycler.findById(req.params.id);
    if (!recycler) return res.status(404).json({ success: false, message: 'Not found' });
    recycler.isApproved = !recycler.isApproved;
    await recycler.save();
    res.json({ success: true, data: recycler });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete user securely cascading
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin root' });

    if (user.role === 'collector') await Collector.deleteOne({ user: user._id });
    if (user.role === 'scrap_dealer') await ScrapDealer.deleteOne({ user: user._id });
    if (user.role === 'recycler') await Recycler.deleteOne({ user: user._id });
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User and associated profiles securely removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllCollectors,
  getAllDealers,
  getAllRecyclers,
  getAllPickups,
  toggleCollector,
  toggleDealerApproval,
  toggleRecyclerApproval,
  deleteUser
};
