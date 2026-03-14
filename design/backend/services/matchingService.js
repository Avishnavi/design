const ScrapDealer = require('../models/ScrapDealer');
const Recycler = require('../models/Recycler');
const { sendNotification } = require('./notificationService');

/**
 * Automatically match a pickup request with the best scrap dealer
 * @param {Object} pickupRequest 
 */
const matchScrapDealer = async (pickupRequest) => {
  try {
    const RADIUS_METERS = 20000; // 20km

    const dealers = await ScrapDealer.find({
      location: {
        $near: {
          $geometry: pickupRequest.location,
          $maxDistance: RADIUS_METERS
        }
      },
      storageCapacity: { $gt: pickupRequest.quantity } // Simple check
    }).limit(1);

    if (dealers.length > 0) {
      const bestDealer = dealers[0];
      
      // Update Pickup Request metadata (optional, as request goes to dealer)
      // In a real flow, the Collector "Delivers" to a dealer. 
      // This function might just return the suggestion or notify the collector.
      
      sendNotification(bestDealer.user, `Incoming waste from Collector. Waste type: ${pickupRequest.wasteType}, Quantity: ${pickupRequest.quantity}`);
      console.log(`Matched Pickup ${pickupRequest._id} with Scrap Dealer ${bestDealer._id}`);
      return true;
    }

    console.log(`No matching scrap dealer for Pickup ${pickupRequest._id}`);
    return false;
  } catch (error) {
    console.error('Error in matchScrapDealer:', error);
    return false;
  }
};

/**
 * Match a scrap dealer's inventory with recyclers when inventory is significant
 * @param {Object} scrapDealer 
 * @param {String} wasteType 
 * @param {Number} quantity 
 */
const notifyRecyclers = async (scrapDealer, wasteType, quantity) => {
  try {
    const RADIUS_METERS = 50000; // 50km

    const recyclers = await Recycler.find({
      location: {
        $near: {
          $geometry: scrapDealer.location,
          $maxDistance: RADIUS_METERS
        }
      }
      // In a real app, match acceptedMaterials too
    }).limit(3);

    for (const recycler of recyclers) {
      sendNotification(recycler.user, `Urgent: Scrap Dealer near you has ${quantity} units of ${wasteType} available for purchase.`);
    }

    console.log(`Notified ${recyclers.length} recyclers for ${wasteType} near Scrap Dealer ${scrapDealer._id}`);
  } catch (error) {
    console.error('Error in notifyRecyclers:', error);
  }
};

module.exports = {
  matchScrapDealer,
  notifyRecyclers
};
