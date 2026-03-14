const express = require('express');
const router = express.Router();
const {
  getInventory,
  verifyWaste,
  sellToRecycler
} = require('../controllers/scrapDealerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/inventory', protect, authorize('scrap-dealer'), getInventory);
router.post('/verify-waste', protect, authorize('scrap-dealer'), verifyWaste);
router.post('/sell-to-recycler', protect, authorize('scrap-dealer'), sellToRecycler);

module.exports = router;
