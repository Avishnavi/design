const mongoose = require('mongoose');
const PickupRequest = require('./models/PickupRequest');
const User = require('./models/User');
const Collector = require('./models/Collector');

async function test() {
  try {
    const dbUrl = "mongodb+srv://admin:Avirec024@cluster.mphv2si.mongodb.net/?appName=cluster";
    await mongoose.connect(dbUrl);
    console.log('Connected.');
    
    // 1. Get a test user
    const user = await User.findOne({ role: 'user' });
    if (!user) {
        console.log('No user found to test with.');
        return;
    }

    // 2. Create a pickup request with area/district
    const newRequest = new PickupRequest({
      userId: user._id,
      wasteType: 'plastic',
      quantity: 5,
      pickupAddress: 'Test Address, Koramangala',
      location: { type: 'Point', coordinates: [77.62, 12.93] },
      area: 'Koramangala',
      district: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      status: 'Pending'
    });

    await newRequest.save();
    console.log('Created request with ID:', newRequest._id);

    // 3. Verify fields
    const saved = await PickupRequest.findById(newRequest._id);
    console.log('Saved Fields - Area:', saved.area, 'District:', saved.district);

    // 4. Test Query Logic (similar to collectorController)
    const pending = await PickupRequest.find({
        status: 'Pending',
        $or: [
            { area: 'Koramangala' },
            { district: 'Bengaluru' }
        ]
    });
    console.log('Found pending requests in Koramangala:', pending.length);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}
test();
