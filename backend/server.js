/**
 * ValuAI Backend Server
 * Express API for startup valuation predictions
 * Runs on Port 4000
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 4000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000';

// ===================
// Middleware
// ===================

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===================
// Database Connection
// ===================

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/valuai';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// ===================
// Mongoose Model
// ===================

const valuationSchema = new mongoose.Schema({
  revenue: { type: Number, required: true },
  team_size: { type: Number, required: true },
  industry: { type: String, required: true },
  valuation_result: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

const Valuation = mongoose.model('Valuation', valuationSchema);

// ===================
// Routes
// ===================

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ValuAI API is running',
    port: PORT
  });
});

// Health check with DB status
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/estimate
 * Receives data from Frontend, forwards to Python ML Service,
 * saves to MongoDB, and returns result
 */
app.post('/api/estimate', async (req, res) => {
  try {
    const { revenue, team_size, industry } = req.body;

    // Validate required fields
    if (revenue === undefined || !industry || team_size === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: revenue, industry, and team_size are required'
      });
    }

    // Validate data types
    const numRevenue = parseFloat(revenue);
    const numTeamSize = parseInt(team_size);

    if (isNaN(numRevenue) || numRevenue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Revenue must be a non-negative number'
      });
    }

    if (isNaN(numTeamSize) || numTeamSize < 1) {
      return res.status(400).json({
        success: false,
        message: 'Team size must be a positive number'
      });
    }

    console.log(`📊 Processing: revenue=${numRevenue}, team_size=${numTeamSize}, industry=${industry}`);

    // Forward to Python ML Service
    let valuation_result;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
        revenue: numRevenue,
        team_size: numTeamSize,
        industry: industry
      }, {
        timeout: 10000
      });

      valuation_result = mlResponse.data.valuation;
      console.log(`🤖 ML Response: ${valuation_result}`);
    } catch (mlError) {
      console.warn('⚠️ ML Service unavailable, using fallback:', mlError.message);
      
      // Fallback calculation
      const multipliers = {
        'Technology': 8, 'Healthcare': 6, 'Finance': 5, 'FinTech': 10,
        'E-commerce': 4, 'Manufacturing': 3, 'EdTech': 5, 'HealthTech': 7,
        'Cybersecurity': 9, 'Gaming': 5, 'IoT': 6, 'Other': 3
      };
      const mult = multipliers[industry] || 3;
      valuation_result = (numRevenue * mult) + (numTeamSize * 50000);
    }

    // Save to MongoDB
    const valuation = new Valuation({
      revenue: numRevenue,
      team_size: numTeamSize,
      industry,
      valuation_result
    });

    await valuation.save();
    console.log(`💾 Saved to DB: ${valuation._id}`);

    // Return result
    res.status(200).json({
      success: true,
      message: 'Valuation calculated successfully',
      data: {
        valuation: valuation_result,
        query_id: valuation._id,
        input: {
          revenue: numRevenue,
          team_size: numTeamSize,
          industry
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get history
app.get('/api/history', async (req, res) => {
  try {
    const queries = await Valuation.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: queries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ===================
// Start Server
// ===================

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   🚀 ValuAI Backend Server                     ║
║   ─────────────────────────────────────────    ║
║   📍 Running on: http://localhost:${PORT}        ║
║   🤖 ML Service: ${ML_SERVICE_URL}     ║
╚════════════════════════════════════════════════╝
    `);
  });
};

startServer();
