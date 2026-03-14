const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { DATABASE_URL } = require('./config/db'); // Imported from centralized config

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// Variable used once for initial connection but passed everywhere via mongoose
mongoose.connect(DATABASE_URL)
  .then(() => console.log('✅ MongoDB Connected to WasteWise Database'))
  .catch(err => console.error('❌ DB Connection Error:', err));

// --- MODELS (Defined for User Platform) ---

const PickupSchema = new mongoose.Schema({
  userId: String,
  wasteType: String,
  weightEst: String,
  address: String,
  status: { type: String, default: 'searching' }, // searching, assigned, picked_up, completed
  collectorId: String,
  createdAt: { type: Date, default: Date.now }
});

const Pickup = mongoose.model('Pickup', PickupSchema);

const UserStatSchema = new mongoose.Schema({
  userId: String,
  totalRecycled: Number, // in kg
  totalEarnings: Number, // in INR
  co2Saved: Number, // in kg
  points: Number
});

const UserStat = mongoose.model('UserStat', UserStatSchema);

// --- ROUTES ---

// 1. Submit Pickup Request (From PickupWizard)
app.post('/api/pickups', async (req, res) => {
  try {
    const newPickup = new Pickup(req.body);
    await newPickup.save();
    res.status(201).json({ message: 'Pickup request submitted!', pickup: newPickup });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit pickup' });
  }
});

// 2. Get User Stats (For Dashboard)
app.get('/api/user/stats/:userId', async (req, res) => {
  try {
    const stats = await UserStat.findOne({ userId: req.params.userId });
    res.json(stats || { totalRecycled: 12.5, totalEarnings: 450, co2Saved: 2.4, points: 1250 }); // Fallback to mock
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 3. Get Active Pickup Tracking (For PickupTracking)
app.get('/api/pickups/active/:userId', async (req, res) => {
  try {
    const active = await Pickup.findOne({ userId: req.params.userId, status: { $ne: 'completed' } }).sort({ createdAt: -1 });
    res.json(active);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active pickup' });
  }
});

// 4. Get History (For History Tab)
app.get('/api/pickups/history/:userId', async (req, res) => {
  try {
    const history = await Pickup.find({ userId: req.params.userId, status: 'completed' }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Default Route
app.get('/', (req, res) => res.send('WasteWise User Platform API Running'));

app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));
