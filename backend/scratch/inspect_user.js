const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function inspectUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findById('69d8cceb45ac90da4417e13b');
        console.log(JSON.stringify(user, null, 2));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectUser();
