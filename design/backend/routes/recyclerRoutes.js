const express = require('express');
const router = express.Router();
const {
  getAvailableScrap,
  buyScrap,
  updateRecyclingStatus
} = require('../controllers/recyclerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/available-scrap', protect, authorize('recycler'), getAvailableScrap);
router.post('/buy-scrap', protect, authorize('recycler'), buyScrap);
router.post('/update-recycling-status', protect, authorize('recycler'), updateRecyclingStatus);

module.exports = router;
