const cron = require('node-cron');
const PickupRequest = require('../models/PickupRequest');
const { assignCollector } = require('../services/collectorService');

/**
 * Initialize background jobs
 */
const initJobs = () => {
  // Retry collector assignment every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[JOB] Retrying pending collector assignments...');
    const pendingRequests = await PickupRequest.find({ status: 'Pending' });

    for (const request of pendingRequests) {
      await assignCollector(request);
    }
  });

  // Example: Check scrap inventory levels every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[JOB] Checking scrap inventory levels...');
    // Add logic to notify recyclers based on inventory
  });
};

module.exports = {
  initJobs
};
