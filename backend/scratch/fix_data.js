const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Database Repair ---');
        
        // Find collectors missing phone numbers
        const res = await User.updateMany(
            { role: 'collector', phone: { $exists: false } },
            { $set: { phone: '+91 98450 12345', address: 'Area Center, HSR Layout' } }
        );
        
        console.log(`Successfully updated ${res.modifiedCount} collector accounts.`);
        
        // Also fix any null phones
        const res2 = await User.updateMany(
            { role: 'collector', phone: null },
            { $set: { phone: '+91 98450 15555' } }
        );
        console.log(`Successfully updated ${res2.modifiedCount} null-phone accounts.`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();
