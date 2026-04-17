const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getAllPickups,
  deleteUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('admin'), getDashboardStats);
router.get('/all-users', protect, authorize('admin'), getAllUsers);
router.get('/all-pickups', protect, authorize('admin'), getAllPickups);
router.delete('/user/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
