/**
 * ValuAI Backend Server
 * Express API for startup valuation predictions
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

// Import Models
const StartupQuery = require('./models/StartupQuery');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 4000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

// ===================
// Middleware
// ===================

// Enable CORS for frontend communication
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Request logging middleware
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
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

// ===================
// Routes
// ===================

/**
 * Health Check Route
 * GET /
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ValuAI API is running',
    version: '1.0.0'
  });
});

/**
 * Health Check Route
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

/**
 * Valuation Estimation Route
 * POST /api/estimate
 * 
 * Request Body:
 * {
 *   revenue: number,
 *   industry: string,
 *   team_size: number
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     valuation: number,
 *     query_id: string
 *   }
 * }
 */
app.post('/api/estimate', async (req, res) => {
  try {
    const { revenue, industry, team_size } = req.body;

    // Validate required fields
    if (revenue === undefined || !industry || team_size === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: revenue, industry, and team_size are required'
      });
    }

    // Validate data types
    if (typeof revenue !== 'number' || revenue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Revenue must be a non-negative number'
      });
    }

    if (typeof team_size !== 'number' || team_size < 1) {
      return res.status(400).json({
        success: false,
        message: 'Team size must be a positive number'
      });
    }

    console.log(`📊 Processing valuation request:`, { revenue, industry, team_size });

    // Call Python ML Service
    let valuation_result;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
        revenue,
        industry,
        team_size
      }, {
        timeout: 10000 // 10 second timeout
      });

      valuation_result = mlResponse.data.valuation || mlResponse.data.predicted_valuation;
      console.log(`🤖 ML Service response:`, mlResponse.data);
    } catch (mlError) {
      // If ML service is unavailable, use a fallback calculation
      console.warn('⚠️ ML Service unavailable, using fallback calculation:', mlError.message);
      
      // Simple fallback formula (for demo purposes)
      // In production, you'd want to handle this differently
      const industryMultipliers = {
        'Technology': 8,
        'Healthcare': 6,
        'Finance': 5,
        'E-commerce': 4,
        'Manufacturing': 3,
        'Other': 2.5
      };
      
      const multiplier = industryMultipliers[industry] || industryMultipliers['Other'];
      valuation_result = revenue * multiplier + (team_size * 50000);
    }

    // Save to MongoDB
    const startupQuery = new StartupQuery({
      revenue,
      industry,
      team_size,
      valuation_result
    });

    await startupQuery.save();
    console.log(`💾 Query saved to database with ID: ${startupQuery._id}`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Valuation calculated successfully',
      data: {
        valuation: valuation_result,
        query_id: startupQuery._id,
        input: {
          revenue,
          industry,
          team_size
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in /api/estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get Query History
 * GET /api/history
 */
app.get('/api/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const queries = await StartupQuery.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await StartupQuery.countDocuments();

    res.json({
      success: true,
      data: queries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error in /api/history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history'
    });
  }
});

// ===================
// Error Handling
// ===================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
║                                                ║
║   🚀 ValuAI Backend Server                     ║
║   ─────────────────────────────────────────    ║
║   📍 Running on: http://localhost:${PORT}        ║
║   📊 MongoDB: ${process.env.MONGODB_URI || 'localhost'}     ║
║   🤖 ML Service: ${ML_SERVICE_URL}    ║
║                                                ║
╚════════════════════════════════════════════════╝
    `);
  });
};

startServer();
