const express = require('express');
const router = express.Router();
const {
  getInventory,
  addWaste,
  sellToRecycler
} = require('../controllers/scrapDealerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/inventory', protect, authorize('scrapDealer'), getInventory);
router.post('/add-waste', protect, authorize('scrapDealer'), addWaste);
router.post('/sell-to-recycler', protect, authorize('scrapDealer'), sellToRecycler);

module.exports = router;
