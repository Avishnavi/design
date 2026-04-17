const ScrapDealer = require('../models/ScrapDealer');
const Recycler = require('../models/Recycler');
const WasteDelivery = require('../models/WasteDelivery');
const { sendNotification } = require('./notificationService');

/**
 * Automatically match a pickup request with the best scrap dealer
 * @param {Object} pickupRequest 
 */
const matchScrapDealer = async (pickupRequest) => {
  try {
    let bestDealer;

    if (pickupRequest.assignedDealer) {
      console.log(`[DEBUG] Pickup ${pickupRequest._id} already has assigned dealer: ${pickupRequest.assignedDealer}. Skipping auto-matching.`);
      bestDealer = await ScrapDealer.findById(pickupRequest.assignedDealer);
    } else {
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
        bestDealer = dealers[0];
        // Assign dealer to pickup request
        pickupRequest.assignedDealer = bestDealer._id;
        await pickupRequest.save();
      }
    }

    if (bestDealer) {
      // Create WasteDelivery record for the dealer to see
      await WasteDelivery.create({
        pickupRequestId: pickupRequest._id,
        scrapDealerId: bestDealer._id,
        collectorId: pickupRequest.assignedCollector,
        wasteType: pickupRequest.wasteType,
        quantity: pickupRequest.quantity,
        status: 'Pending'
      });
      
      sendNotification(bestDealer.user, `Incoming waste from Collector. Waste type: ${pickupRequest.wasteType}, Quantity: ${pickupRequest.quantity}`);
      console.log(`Matched Pickup ${pickupRequest._id} with Scrap Dealer ${bestDealer._id} and created delivery record`);
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
