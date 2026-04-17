const express = require('express');
const router = express.Router();
const {
  getAvailableScrap,
  buyScrap,
  updateRecyclingStatus,
  getAllRecyclers,
  getDashboardData,
  getReports,
  getRecyclerProfile,
  updateRecyclerProfile
} = require('../controllers/recyclerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getAllRecyclers);
router.get('/available-scrap', protect, authorize('recycler'), getAvailableScrap);
router.post('/buy-scrap', protect, authorize('recycler'), buyScrap);
router.post('/update-recycling-status', protect, authorize('recycler'), updateRecyclingStatus);
router.get('/dashboard', protect, authorize('recycler'), getDashboardData);
router.get('/reports', protect, authorize('recycler'), getReports);
router.get('/profile', protect, authorize('recycler'), getRecyclerProfile);
router.put('/update-profile', protect, authorize('recycler'), updateRecyclerProfile);

module.exports = router;
