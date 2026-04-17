const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Priority: 1. Environment Variable, 2. Atlas Cluster (from previous config), 3. Localhost
    const dbUrl = process.env.MONGO_URI || "mongodb+srv://admin:Avirec024@cluster.mphv2si.mongodb.net/?appName=cluster";
    
    const conn = await mongoose.connect(dbUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Ensure Geospatial Indexes
    const User = require('../models/User');
    const Collector = require('../models/Collector');
    const ScrapDealer = require('../models/ScrapDealer');
    
    await User.collection.createIndex({ location: "2dsphere" });
    await Collector.collection.createIndex({ location: "2dsphere" });
    await ScrapDealer.collection.createIndex({ location: "2dsphere" });
    console.log('Geospatial indexes verified.');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
