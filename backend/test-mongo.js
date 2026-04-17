const mongoose = require('mongoose');

async function testConnection(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Successfully connected to: ${uri}`);
    process.exit(0);
  } catch (error) {
    console.log(`Failed to connect to: ${uri}`);
    console.error(error.message);
    process.exit(1);
  }
}

testConnection(process.argv[2]);
