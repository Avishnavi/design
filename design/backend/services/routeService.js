const PickupRequest = require('../models/PickupRequest');
const Collector = require('../models/Collector');

/**
 * Basic route optimization for a collector
 * @param {String} collectorId 
 */
const optimizeRoute = async (collectorId) => {
  try {
    const collector = await Collector.findById(collectorId);
    if (!collector) return null;

    // Fetch active pickups for this collector
    const activePickups = await PickupRequest.find({
      collector: collectorId,
      status: 'Collector Assigned'
    });

    // Simple sorting by distance from collector's current location
    // In a production app, use TSP algorithm or external API for true optimization
    const sortedPickups = activePickups.sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.location.coordinates[0] - collector.location.coordinates[0], 2) +
        Math.pow(a.location.coordinates[1] - collector.location.coordinates[1], 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.location.coordinates[0] - collector.location.coordinates[0], 2) +
        Math.pow(b.location.coordinates[1] - collector.location.coordinates[1], 2)
      );
      return distA - distB;
    });

    return sortedPickups.map(p => p._id);
  } catch (error) {
    console.error('Error in optimizeRoute:', error);
    return null;
  }
};

module.exports = {
  optimizeRoute
};
