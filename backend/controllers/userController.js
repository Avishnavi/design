const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');
const { assignCollector } = require('../services/collectorService');
const { searchDealers } = require('../services/dealerSearchService');

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
      user.area = req.body.area || user.area;
      user.district = req.body.district || user.district;
      user.state = req.body.state || user.state;
      user.country = req.body.country || user.country;

      const updatedUser = await user.save();
      res.json({
        success: true,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        area: updatedUser.area,
        district: updatedUser.district,
        state: updatedUser.state,
        country: updatedUser.country,
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
    const { 
      wasteType, 
      quantity, 
      pickupAddress, 
      location: bodyLocation, 
      assignedDealer,
      area: bodyArea,
      district: bodyDistrict,
      state: bodyState,
      country: bodyCountry
    } = req.body;

    // Prioritize location from request body, then user profile, then fallback
    const location = bodyLocation && bodyLocation.coordinates
      ? bodyLocation
      : (req.user.location && req.user.location.coordinates 
          ? req.user.location 
          : { type: 'Point', coordinates: [0, 0] });
    
    // Hierarchical location logic
    const area = bodyArea || req.user.area || '';
    const district = bodyDistrict || req.user.district || '';
    const state = bodyState || req.user.state || '';
    const country = bodyCountry || req.user.country || '';

    // Constant Pricing mapping for testing
    const priceMap = {
      'plastic': 12,
      'paper': 8,
      'metal': 25,
      'ewaste': 40,
      'glass': 5,
      'mixed': 10
    };
    const agreedPrice = priceMap[wasteType.toLowerCase()] || 15;

    const newRequest = new PickupRequest({
      userId: req.user.id,
      location,
      wasteType,
      quantity,
      pickupAddress,
      assignedDealer, // Save the dealer selected by the user
      agreedPrice,    // Save the agreed price
      area,
      district,
      state,
      country,
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

const ScrapDealer = require('../models/ScrapDealer');

// @desc    Get nearby dealers
// @route   GET /api/user/nearby-dealers
// @access  Private (User)
const getNearbyDealers = async (req, res) => {
  try {
    const { lat, lng, area, district, wasteType } = req.query;

    if (!lat || !lng && !area && !district) {
      return res.status(400).json({ success: false, message: 'Location information (GPS or Area) is required' });
    }

    const dealers = await searchDealers({ 
        lat, 
        lng, 
        area, 
        district, 
        wasteType, 
        limit: 10 
    });

    // Add mock distance and rating for UI
    const formattedDealers = dealers.map(dealer => {
      // Use dealer's specific pricing if available, or fall back to system default
      const priceMap = {
        'plastic': 12,
        'paper': 8,
        'metal': 25,
        'ewaste': 40,
        'glass': 5,
        'mixed': 10
      };
      const displayPrice = priceMap[wasteType.toLowerCase()] || 15;

      return {
        _id: dealer._id,
        name: dealer.dealerName,
        distance: (Math.random() * 5).toFixed(1) + ' km',
        rating: (4 + Math.random()).toFixed(1),
        price: '₹ ' + displayPrice + '/kg',
        area: dealer.area || dealer.district || 'Nearby',
        matchType: dealer.matchType // Pass the matchType (Local/Regional) to the UI
      };
    });

    res.json({ success: true, data: formattedDealers });
  } catch (error) {
    console.error('Get Nearby Dealers Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  createPickupRequest,
  getPickupHistory,
  getNearbyDealers
};
