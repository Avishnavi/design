const Collector = require('../models/Collector');
const PickupRequest = require('../models/PickupRequest');
const { matchScrapDealer } = require('../services/matchingService');

// @desc    Get collector dashboard stats
// @route   GET /api/collector/dashboard
// @access  Private (Collector)
const getDashboardStats = async (req, res) => {
  try {
    const collector = await Collector.findOne({ user: req.user.id });
    if (!collector) return res.status(404).json({ success: false, message: 'Collector not found' });

    const totalPickups = await PickupRequest.countDocuments({ assignedCollector: collector._id, status: 'Recycled' });
    const activePickups = await PickupRequest.countDocuments({ assignedCollector: collector._id, status: { $in: ['Assigned', 'On The Way', 'Collected'] } });
    
    // Mock earnings calculation
    const earnings = totalPickups * 50; 

    res.json({
      success: true,
      data: {
        totalPickups,
        activePickups,
        earnings,
        availabilityStatus: collector.availabilityStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get assigned pickup requests (Pending/Active)
// @route   GET /api/collector/pickup-requests
// @access  Private (Collector)
const getAssignedRequests = async (req, res) => {
  try {
    const collector = await Collector.findOne({ user: req.user.id });
    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector profile not found' });
    }

    // 1. Get explicitly assigned requests FIRST (Always safe)
    const assignedRequests = await PickupRequest.find({
      assignedCollector: collector._id,
      status: { $in: ['Assigned', 'On The Way', 'Collected'] }
    }).populate('userId', 'name phone address');

    const assignedIds = assignedRequests.map(r => r._id.toString());

    // 2. Get pending requests
    const coords = collector.location?.coordinates;
    const isInvalidLocation = !coords || coords.length < 2 || (coords[0] === 0 && coords[1] === 0);

    let pendingRequests = [];
    if (isInvalidLocation) {
      // Show all pending if location is unknown
      pendingRequests = await PickupRequest.find({ 
        status: 'Pending',
        _id: { $nin: assignedIds }
      })
      .populate('userId', 'name phone address')
      .limit(20);
    } else {
      // Use $near only with valid location
      try {
        pendingRequests = await PickupRequest.find({
          status: 'Pending',
          _id: { $nin: assignedIds },
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: coords },
              $maxDistance: 50000 // 50km
            }
          }
        })
        .populate('userId', 'name phone address')
        .limit(50);
      } catch (geoError) {
        console.error('Geo Query Error, falling back to basic find:', geoError.message);
        pendingRequests = await PickupRequest.find({ 
          status: 'Pending',
          _id: { $nin: assignedIds }
        })
        .populate('userId', 'name phone address')
        .limit(20);
      }
    }

    // Combine results
    const combined = [...assignedRequests, ...pendingRequests];

    res.json({ success: true, count: combined.length, data: combined });
  } catch (error) {
    console.error('CRITICAL: Error in getAssignedRequests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get pickup history
// @route   GET /api/collector/pickup-history
// @access  Private (Collector)
const getPickupHistory = async (req, res) => {
  try {
    const collector = await Collector.findOne({ user: req.user.id });
    const history = await PickupRequest.find({ 
      assignedCollector: collector._id, 
      status: { $in: ['SentToDealer', 'Recycled'] } 
    }).populate('userId', 'name address');

    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update collector live location
// @route   POST /api/collector/update-location
// @access  Private (Collector)
const updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body; // [lng, lat]
    await Collector.findOneAndUpdate(
      { user: req.user.id },
      { location: { type: 'Point', coordinates } }
    );
    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get monthly pickup stats
// @route   GET /api/collector/monthly-pickups
// @access  Private (Collector)
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

const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const collector = await Collector.findOne({ user: req.user.id });
    const request = await PickupRequest.findById(requestId);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    
    // Check if already assigned to someone else
    if (request.status !== 'Pending' && request.assignedCollector?.toString() !== collector._id.toString()) {
        return res.status(400).json({ success: false, message: 'Request already assigned to another collector' });
    }

    request.status = 'Assigned'; 
    request.assignedCollector = collector._id;
    await request.save();

    // Update Collector stats
    const alreadyAssigned = collector.assignedRequests.some(
      id => id.toString() === request._id.toString()
    );

    if (!alreadyAssigned) {
        collector.assignedRequests.push(request._id);
        collector.activePickupCount += 1;
        await collector.save();
    }

    res.json({ success: true, message: 'Request accepted', data: request });
  } catch (error) {
    console.error('Accept Request Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updatePickupStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    console.log(`[DEBUG] Attempting status update for Request ${requestId} to status: ${status}`);
    
    if (!requestId) {
        return res.status(400).json({ success: false, message: 'Request ID is required' });
    }

    const statusStr = String(status || '').trim();
    const validStatuses = ['Assigned', 'On The Way', 'Arrived', 'Collected', 'SentToDealer'];
    
    // Case-insensitive matching to be safe
    const normalizedStatus = validStatuses.find(s => s.toLowerCase() === statusStr.toLowerCase());
    
    if (!normalizedStatus) {
      console.log(`[ERROR] Invalid status requested: "${statusStr}"`);
      return res.status(400).json({ success: false, message: `Invalid status: ${statusStr}` });
    }

    const request = await PickupRequest.findById(requestId);
    if (!request) {
        console.log(`[ERROR] Request not found: ${requestId}`);
        return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Auto-assign if it was pending
    if (request.status === 'Pending') {
        const collector = await Collector.findOne({ user: req.user.id });
        request.assignedCollector = collector._id;
    }

    request.status = normalizedStatus;
    await request.save();
    console.log(`[SUCCESS] Status updated to ${normalizedStatus} for Request ${requestId}`);
    
    if (status === 'SentToDealer') {
        try {
            await matchScrapDealer(request);
        } catch (matchError) {
            console.error('Error during dealer matching:', matchError);
            // Non-blocking error for the status update
        }
    }

    res.json({ success: true, message: `Status updated to ${status}`, data: request });
  } catch (error) {
    console.error('CRITICAL: Error in updatePickupStatus:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAssignedRequests,
  getPickupHistory,
  updateLocation,
  getMonthlyPickups,
  acceptRequest,
  updatePickupStatus
};
