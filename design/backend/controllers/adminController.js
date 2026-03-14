const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');

// @desc    Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPickups = await PickupRequest.countDocuments();
    const pendingPickups = await PickupRequest.countDocuments({ status: 'Pending' });
    const collectedPickups = await PickupRequest.countDocuments({ status: 'Collected' });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPickups,
        pendingPickups,
        collectedPickups
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/all-users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all pickups
// @route   GET /api/admin/all-pickups
// @access  Private (Admin)
const getAllPickups = async (req, res) => {
  try {
    const pickups = await PickupRequest.find().populate('userId', 'name email');
    res.json({ success: true, count: pickups.length, data: pickups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/user/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllPickups,
  deleteUser
};
