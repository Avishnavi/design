const mongoose = require('mongoose');
require('dotenv').config();
const Collector = require('../models/Collector');
const User = require('../models/User');
const WasteDelivery = require('../models/WasteDelivery');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- DB Inspection ---');
        
        const collectors = await Collector.find().populate('user');
        console.log(`Total Collectors: ${collectors.length}`);
        collectors.forEach(c => {
            console.log(`Collector ID: ${c._id}, User Name: ${c.user?.name}, User ID: ${c.user?._id}, Phone: ${c.user?.phone || 'MISSING'}`);
        });

        const deliveries = await WasteDelivery.find().populate({
            path: 'collectorId',
            populate: { path: 'user' }
        });
        console.log(`\nTotal Deliveries: ${deliveries.length}`);
        deliveries.forEach(d => {
            console.log(`Delivery ID: ${d._id}`);
            console.log(`  Collector: ${d.collectorId?.user?.name || 'NULL'}`);
            console.log(`  Phone: ${d.collectorId?.user?.phone || 'NULL'}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
