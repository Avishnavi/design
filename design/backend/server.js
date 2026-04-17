const dotenv = require('dotenv');
// Load env vars immediately
dotenv.config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { initJobs } = require('./jobs/assignmentJob');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/collector', require('./routes/collectorRoutes'));
app.use('/api/dealer', require('./routes/dealerRoutes'));
app.use('/api/recycler', require('./routes/recyclerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root Route
app.get('/', (req, res) => {
  res.send('Waste Management System API is running...');
});

// Initialize Background Jobs
initJobs();

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
