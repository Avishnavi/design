const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ScrapDealer = require('../models/ScrapDealer');
const User = require('../models/User');

async function sync() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is not defined in .env');
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    
    const dealers = await ScrapDealer.find({}).populate('user');
    console.log(`Found ${dealers.length} dealers.`);
    
    let count = 0;
    for (const d of dealers) {
      if (d.user) {
        let changed = false;
        
        if (!d.area && d.user.area) { d.area = d.user.area; changed = true; }
        if (!d.district && d.user.district) { d.district = d.user.district; changed = true; }
        if (!d.state && d.user.state) { d.state = d.user.state; changed = true; }
        if (!d.country && d.user.country) { d.country = d.user.country; changed = true; }
        
        if (changed) {
          await d.save();
          count++;
          console.log(`Synced: ${d.dealerName || d.user.name}`);
        }
      }
    }
    
    console.log(`Sync complete. Updated ${count} dealers.`);
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

sync();
