const User = require('../models/User');
const Collector = require('../models/Collector');
const PickupRequest = require('../models/PickupRequest');
const { matchScrapDealer } = require('../services/matchingService');

// @desc    Get collector dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    let collector = await Collector.findOne({ user: req.user.id });
    if (!collector && req.user.role === 'collector') {
      console.log(`[DEBUG] Auto-creating missing Collector profile for User ID: ${req.user.id}`);
      collector = await Collector.create({
        user: req.user.id,
        location: req.user.location || { type: 'Point', coordinates: [0, 0] },
        area: req.user.area || '',
        district: req.user.district || '',
        state: req.user.state || '',
        country: req.user.country || '',
        availabilityStatus: true
      });
    }

    if (!collector) {
      console.log(`[DEBUG] Collector profile NOT FOUND for User ID: ${req.user.id}`);
      return res.status(404).json({ success: false, message: 'Collector profile not found' });
    }

    const totalPickups = await PickupRequest.countDocuments({ assignedCollector: collector._id, status: 'Recycled' });
    const activePickups = await PickupRequest.countDocuments({ 
      assignedCollector: collector._id, 
      status: { $in: ['Assigned', 'On The Way', 'Arrived', 'Collected'] } 
    });
    
    res.json({ success: true, data: { totalPickups, activePickups, earnings: totalPickups * 50, availabilityStatus: collector.availabilityStatus, user: { name: req.user.name, phone: req.user.phone, address: req.user.address, area: req.user.area || collector.area, district: req.user.district || collector.district } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get assigned and available pickup requests
const getAssignedRequests = async (req, res) => {
  try {
    let collector = await Collector.findOne({ user: req.user.id });
    if (!collector && req.user.role === 'collector') {
      console.log(`[DEBUG] Auto-creating missing Collector profile (AssignedRequests) for User ID: ${req.user.id}`);
      collector = await Collector.create({
        user: req.user.id,
        location: req.user.location || { type: 'Point', coordinates: [0, 0] },
        area: req.user.area || '',
        district: req.user.district || '',
        state: req.user.state || '',
        country: req.user.country || '',
        availabilityStatus: true
      });
    }

    if (!collector) {
      console.log(`[DEBUG] Collector profile NOT FOUND (AssignedRequests) for User ID: ${req.user.id}`);
      return res.status(404).json({ success: false, message: 'Collector profile not found' });
    }

    // 1. Get requests explicitly assigned to this collector
    // We check both Collector _id and User id just in case of assignment logic mismatch
    const assignedRequests = await PickupRequest.find({
      $or: [
        { assignedCollector: collector._id },
        { assignedCollector: req.user.id }
      ],
      status: { $in: ['Assigned', 'On The Way', 'Arrived', 'Collected'] }
    })
    .populate('userId', 'name phone address')
    .populate('assignedDealer', 'dealerName location area district');

    const assignedIds = assignedRequests.map(r => r._id.toString());

    // 2. Get pending requests
    const coords = collector.location?.coordinates;
    const isInvalidLocation = !coords || coords.length < 2 || (coords[0] === 0 && coords[1] === 0);

    let pendingRequests = [];

    // If location is valid, try geo-search first
    if (!isInvalidLocation) {
      try {
        pendingRequests = await PickupRequest.find({
          status: 'Pending',
          _id: { $nin: assignedIds },
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: coords },
              $maxDistance: 100000 // Increased to 100km
            }
          }
        }).populate('userId', 'name phone address').limit(20);
      } catch (err) {
        console.error('Geo search error:', err);
      }
    }

    // Fallback: If no nearby pending found, or location is invalid/unavailable
    if (pendingRequests.length === 0) {
      const query = { 
        status: 'Pending',
        _id: { $nin: assignedIds }
      };

      // Try area-based fallback if GPS failed
      const searchArea = collector.area || req.user.area;
      const searchDistrict = collector.district || req.user.district;

      if (searchArea || searchDistrict) {
        query.$or = [];
        if (searchArea) query.$or.push({ area: searchArea });
        if (searchDistrict) query.$or.push({ district: searchDistrict });
      }

      pendingRequests = await PickupRequest.find(query)
        .populate('userId', 'name phone address')
        .populate('assignedDealer', 'dealerName location area district')
        .sort({ createdAt: -1 })
        .limit(20);
      
      // If area search still yields nothing, show ALL pending (global fallback)
      if (pendingRequests.length === 0 && query.$or) {
        delete query.$or;
        pendingRequests = await PickupRequest.find(query)
          .populate('userId', 'name phone address')
          .populate('assignedDealer', 'dealerName location area district')
          .sort({ createdAt: -1 })
          .limit(20);
      }
    }

    const combined = [...assignedRequests, ...pendingRequests];
    
    // Debug log to server console
    console.log(`[DEBUG] Collector ${collector._id} (User: ${req.user.id}) - Assigned: ${assignedRequests.length}, Pending: ${pendingRequests.length}`);

    res.json({ success: true, count: combined.length, data: combined });
  } catch (error) {
    console.error('getAssignedRequests Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update pickup status
const updatePickupStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const request = await PickupRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const collector = await Collector.findOne({ user: req.user.id });
    
    // Auto-assign if collector interacts with a Pending request
    if (request.status === 'Pending') {
      request.assignedCollector = collector._id;
    }

    request.status = status;
    await request.save();

    if (status === 'SentToDealer' && request.assignedDealer) {
      const WasteDelivery = require('../models/WasteDelivery');
      await WasteDelivery.create({
        pickupRequestId: request._id,
        scrapDealerId: request.assignedDealer,
        collectorId: collector._id,
        wasteType: request.wasteType,
        quantity: request.quantity,
        status: 'Pending',
        deliveryDate: Date.now()
      });
      console.log(`[DEBUG] Created WasteDelivery for Dealer ${request.assignedDealer}`);
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const collector = await Collector.findOne({ user: req.user.id });
    const request = await PickupRequest.findById(requestId);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    
    request.status = 'Assigned'; 
    request.assignedCollector = collector._id;
    await request.save();

    res.json({ success: true, message: 'Request accepted', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    await Collector.findOneAndUpdate(
      { user: req.user.id },
      { location: { type: 'Point', coordinates } }
    );
    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getPickupHistory = async (req, res) => {
  try {
    const collector = await Collector.findOne({ user: req.user.id });
    const history = await PickupRequest.find({ 
      assignedCollector: collector._id, 
      status: { $in: ['SentToDealer', 'Recycled'] } 
    }).populate('userId', 'name address');
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getMonthlyPickups = async (req, res) => {
  try {
    const collector = await Collector.findOne({ user: req.user.id });
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const count = await PickupRequest.countDocuments({
      assignedCollector: collector._id,
      createdAt: { $gte: startOfMonth }
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


const updateCollectorProfile = async (req, res) => {
  try {
    const collector = await Collector.findOne({ user: req.user.id });
    if (!collector) return res.status(404).json({ success: false, message: 'Collector not found' });
    const { name, phone, address, area, district, state, country } = req.body;
    const user = await User.findById(req.user.id);
    if (user) {
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (address) user.address = address;
      if (area) user.area = area;
      if (district) user.district = district;
      if (state) user.state = state;
      if (country) user.country = country;
      await user.save();
    }
    if (area) collector.area = area;
    if (district) collector.district = district;
    await collector.save();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getDashboardStats,
  getAssignedRequests,
  getPickupHistory,
  updateLocation,
  getMonthlyPickups,
  acceptRequest,
  updatePickupStatus,
  updateCollectorProfile
};


