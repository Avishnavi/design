const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getInventory,
  getWasteFromCollectors,
  verifyWaste,
  sellToRecycler,
  getTransactions
} = require('../controllers/scrapDealerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('scrapDealer'), getDashboardStats);
router.get('/inventory', protect, authorize('scrapDealer'), getInventory);
router.get('/waste-from-collectors', protect, authorize('scrapDealer'), getWasteFromCollectors);
router.post('/verify-waste', protect, authorize('scrapDealer'), verifyWaste);
router.post('/sell-to-recycler', protect, authorize('scrapDealer'), sellToRecycler);
router.get('/transactions', protect, authorize('scrapDealer'), getTransactions);

module.exports = router;
