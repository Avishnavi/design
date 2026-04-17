const PickupRequest = require('../models/PickupRequest');

/**
 * Smart Scheduling Service
 * Predicts the best time for pickups to avoid traffic and balance collector workload.
 */

// Simple Traffic Model (Mock data for demo/internship purposes)
// 08:00 - 10:00 (Morning Peak) -> Multiplier 2.5
// 17:00 - 19:00 (Evening Peak) -> Multiplier 2.0
// 11:00 - 16:00 (Off Peak) -> Multiplier 1.0
const getTrafficMultiplier = (hour) => {
  if (hour >= 8 && hour <= 10) return 2.5;
  if (hour >= 17 && hour <= 19) return 2.0;
  return 1.0;
};

/**
 * Predict the estimated duration for a pickup given the distance and time of day
 * @param {Number} distanceKm 
 * @param {Date} startTime 
 */
const estimatePickupDuration = (distanceKm, startTime) => {
  const baseSpeedKmH = 30; // 30 km/h average speed
  const hour = startTime.getHours();
  const multiplier = getTrafficMultiplier(hour);
  
  const baseDurationMinutes = (distanceKm / baseSpeedKmH) * 60;
  return baseDurationMinutes * multiplier;
};

/**
 * Automatically schedule a pickup at the best possible time slot
 * @param {Object} pickupRequest 
 */
const suggestSmartTimeSlot = async (pickupRequest) => {
  try {
    const now = new Date();
    let bestTime = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour from now

    // If user has a preferred time, we start from there
    if (pickupRequest.preferredTimeSlot && pickupRequest.preferredTimeSlot.start) {
      bestTime = new Date(pickupRequest.preferredTimeSlot.start);
    }

    // Traffic awareness: if the bestTime falls into a peak hour, suggest shifting it
    const hour = bestTime.getHours();
    const multiplier = getTrafficMultiplier(hour);

    if (multiplier > 1.5) {
      console.log(`[SMART SCHEDULING] Traffic is predicted to be high at ${hour}:00. Suggesting a shift...`);
      // Shift to the next off-peak hour (e.g., 11 AM)
      if (hour >= 8 && hour <= 10) {
        bestTime.setHours(11, 0, 0, 0);
      } else if (hour >= 17 && hour <= 19) {
        bestTime.setHours(20, 0, 0, 0);
      }
    }

    pickupRequest.scheduledTime = bestTime;
    await pickupRequest.save();

    console.log(`[SMART SCHEDULING] Pickup ${pickupRequest._id} scheduled at ${bestTime.toLocaleString()}`);
    return bestTime;
  } catch (error) {
    console.error('Error in suggestSmartTimeSlot:', error);
    return null;
  }
};

module.exports = {
  suggestSmartTimeSlot,
  estimatePickupDuration
};
