const User = require('../models/User');
const Collector = require('../models/Collector');
const ScrapDealer = require('../models/ScrapDealer');
const Recycler = require('../models/Recycler');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role, location } = req.body;

    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Ensure location has a default structure
    const userLocation = location || { type: 'Point', coordinates: [0, 0] };

    // Create User
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: role || 'user',
      location: userLocation
    });

    // Create role-specific profile
    if (user.role === 'collector') {
      await Collector.create({ 
        user: user._id, 
        location: userLocation,
        availabilityStatus: true,
        activePickupCount: 0
      });
    } else if (user.role === 'scrapDealer') {
      await ScrapDealer.create({ 
        user: user._id, 
        dealerName: user.name,
        location: userLocation, 
        storageCapacity: 1000,
        acceptedWasteTypes: []
      });
    } else if (user.role === 'recycler') {
      await Recycler.create({ 
        user: user._id, 
        companyName: user.name,
        location: userLocation, 
        maxPurchaseCapacity: 5000,
        acceptedMaterials: []
      });
    }

    if (user) {
      res.status(201).json({
        success: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, role: requestedRole } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Validate role if requestedRole is provided (to prevent user from logging into collector app, etc.)
      if (requestedRole && user.role !== requestedRole) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. You are registered as a ${user.role}, not a ${requestedRole}.` 
        });
      }

      res.json({
        success: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
     res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
