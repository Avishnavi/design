const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');
const { assignCollector } = require('../services/collectorService');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private (User)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/update-profile
// @access  Private (User)
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      if (req.body.password) {
        user.password = req.body.password;
      }
      if (req.body.location) {
        user.location = req.body.location;
      }

      const updatedUser = await user.save();
      res.json({
        success: true,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        token: req.body.token,
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a pickup request
// @route   POST /api/user/pickup-request
// @access  Private (User)
const createPickupRequest = async (req, res) => {
  try {
    const { wasteType, quantity, pickupAddress, location: bodyLocation } = req.body;

    // Prioritize location from request body, then user profile, then fallback
    const location = bodyLocation && bodyLocation.coordinates
      ? bodyLocation
      : (req.user.location && req.user.location.coordinates 
          ? req.user.location 
          : { type: 'Point', coordinates: [0, 0] });

    const newRequest = new PickupRequest({
      userId: req.user.id,
      location,
      wasteType,
      quantity,
      pickupAddress,
      status: 'Pending'
    });

    await newRequest.save();

    // Trigger Automatic Collector Assignment
    const assigned = await assignCollector(newRequest);

    res.status(201).json({
      success: true,
      message: assigned ? 'Pickup request created and collector assigned!' : 'Pickup request created, waiting for available collector.',
      data: newRequest,
      assigned
    });

  } catch (error) {
    console.error('Create Pickup Request Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get pickup history
// @route   GET /api/user/pickup-history
// @access  Private (User)
const getPickupHistory = async (req, res) => {
  try {
    const history = await PickupRequest.find({ userId: req.user.id })
      .populate({
        path: 'assignedCollector',
        select: 'location availabilityStatus', // Include location field from Collector model
        populate: { path: 'user', select: 'name phone' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  createPickupRequest,
  getPickupHistory
};
