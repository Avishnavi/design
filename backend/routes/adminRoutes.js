const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, getAllUsers, getAllCollectors, 
  getAllDealers, getAllRecyclers, getAllPickups, 
  toggleCollector, toggleDealerApproval, toggleRecyclerApproval, 
  deleteUser 
} = require('../controllers/adminController');

// All paths are accessible for Admin panel UI testing currently
// Add authorize('admin') middleware whenever security is needed

router.get('/dashboard', getDashboardStats);
router.get('/all-users', getAllUsers);
router.get('/all-collectors', getAllCollectors);
router.get('/all-dealers', getAllDealers);
router.get('/all-recyclers', getAllRecyclers);
router.get('/all-pickups', getAllPickups);

router.delete('/user/:id', deleteUser);
router.put('/toggle-collector/:id', toggleCollector);
router.put('/approve-dealer/:id', toggleDealerApproval);
router.put('/approve-recycler/:id', toggleRecyclerApproval);

module.exports = router;
