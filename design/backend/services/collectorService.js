const Collector = require('../models/Collector');
const PickupRequest = require('../models/PickupRequest');

/**
 * Automatically find and assign a collector to a pickup request
 * @param {Object} pickupRequest 
 */
const assignCollector = async (pickupRequest) => {
  try {
    const RADIUS_KM = 15;
    const RADIUS_METERS = RADIUS_KM * 1000;

    // Find available collectors near the pickup location
    // Note: This assumes collectors have a location set. 
    // If not, we might need a fallback.
    const collectors = await Collector.find({
      location: {
        $near: {
          $geometry: pickupRequest.location,
          $maxDistance: RADIUS_METERS
        }
      },
      availabilityStatus: true
    })
    .sort({ activePickupCount: 1 }) // Least active pickups first
    .limit(1);

    if (collectors.length > 0) {
      const bestCollector = collectors[0];

      // Update Pickup Request
      pickupRequest.assignedCollector = bestCollector._id;
      pickupRequest.status = 'Assigned';
      await pickupRequest.save();

      // Update Collector
      bestCollector.activePickupCount += 1;
      bestCollector.assignedRequests.push(pickupRequest._id);
      await bestCollector.save();

      console.log(`Assigned Collector ${bestCollector._id} to Pickup ${pickupRequest._id}`);
      return true;
    }

    console.log(`No available collector found for Pickup ${pickupRequest._id}`);
    return false;
  } catch (error) {
    console.error('Error in assignCollector:', error);
    return false;
  }
};

module.exports = {
  assignCollector
};
