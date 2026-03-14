const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  createPickupRequest,
  getPickupHistory
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.put('/update-profile', protect, updateUserProfile);
router.post('/pickup-request', protect, authorize('user'), createPickupRequest);
router.get('/pickup-history', protect, authorize('user'), getPickupHistory);

module.exports = router;
