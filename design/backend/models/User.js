const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'collector', 'scrapDealer', 'recycler', 'admin'],
    default: 'user'
  },
  location: { // Keeping location for geospatial queries as it's implied by "Find collectors within a certain radius"
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
