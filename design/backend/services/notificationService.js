/**
 * Simple notification service to log notifications
 * Can be extended to send Email/SMS/Push notifications
 */
const sendNotification = (userId, message) => {
  console.log(`[NOTIFICATION] to User(${userId}): ${message}`);
  // In a real app, you'd integrate with Twilio, SendGrid, etc.
};

module.exports = {
  sendNotification
};
