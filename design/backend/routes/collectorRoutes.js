const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAssignedRequests,
  getPickupHistory,
  updateLocation,
  getMonthlyPickups,
  acceptRequest,
  updatePickupStatus
} = require('../controllers/collectorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('collector'), getDashboardStats);
router.get('/pickup-requests', protect, authorize('collector'), getAssignedRequests);
router.get('/pickup-history', protect, authorize('collector'), getPickupHistory);
router.get('/monthly-pickups', protect, authorize('collector'), getMonthlyPickups);
router.post('/accept-request', protect, authorize('collector'), acceptRequest);
router.post('/update-status', protect, authorize('collector'), updatePickupStatus);
router.post('/update-location', protect, authorize('collector'), updateLocation);

module.exports = router;
