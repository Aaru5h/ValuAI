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
// Available Options
// ===================

const INDUSTRIES = ['Cybersecurity', 'E-Commerce', 'EdTech', 'FinTech', 'Gaming', 'HealthTech', 'IoT'];
const REGIONS = ['Australia', 'Europe', 'North America', 'South America'];
const EXIT_STATUSES = ['IPO', 'Private'];

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
    version: '2.0.0'
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
 * Get Available Options
 * GET /api/options
 */
app.get('/api/options', (req, res) => {
  res.json({
    success: true,
    options: {
      industries: INDUSTRIES,
      regions: REGIONS,
      exit_statuses: EXIT_STATUSES
    }
  });
});

/**
 * Valuation Estimation Route
 * POST /api/estimate
 * 
 * Request Body:
 * {
 *   funding_rounds: number,
 *   funding_amount: number (in millions USD),
 *   revenue: number (in millions USD),
 *   employees: number,
 *   market_share: number (percentage),
 *   profitable: boolean,
 *   year_founded: number,
 *   industry: string,
 *   region: string,
 *   exit_status: string
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
    const { 
      funding_rounds,
      funding_amount,
      revenue, 
      employees,
      market_share,
      profitable,
      year_founded,
      industry, 
      region,
      exit_status
    } = req.body;

    // Validate required fields
    if (revenue === undefined || !industry || employees === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: revenue, industry, and employees are required'
      });
    }

    // Validate data types
    if (typeof revenue !== 'number' || revenue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Revenue must be a non-negative number'
      });
    }

    if (typeof employees !== 'number' || employees < 1) {
      return res.status(400).json({
        success: false,
        message: 'Employees must be a positive number'
      });
    }

    // Validate industry
    if (!INDUSTRIES.includes(industry)) {
      return res.status(400).json({
        success: false,
        message: `Invalid industry. Must be one of: ${INDUSTRIES.join(', ')}`
      });
    }

    // Validate optional fields
    const validatedRegion = region && REGIONS.includes(region) ? region : 'North America';
    const validatedExitStatus = exit_status && EXIT_STATUSES.includes(exit_status) ? exit_status : 'Private';

    console.log(`📊 Processing valuation request:`, { 
      funding_rounds, 
      funding_amount, 
      revenue, 
      employees,
      market_share,
      profitable,
      year_founded,
      industry,
      region: validatedRegion,
      exit_status: validatedExitStatus
    });

    // Call Python ML Service
    let valuation_result;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
        funding_rounds: funding_rounds || 1,
        funding_amount: funding_amount || 0,
        revenue,
        employees,
        market_share: market_share || 0,
        profitable: profitable || false,
        year_founded: year_founded || new Date().getFullYear(),
        industry,
        region: validatedRegion,
        exit_status: validatedExitStatus
      }, {
        timeout: 10000 // 10 second timeout
      });

      valuation_result = mlResponse.data.valuation || mlResponse.data.predicted_valuation;
      console.log(`🤖 ML Service response:`, mlResponse.data);
    } catch (mlError) {
      // If ML service is unavailable, use a fallback calculation
      console.warn('⚠️ ML Service unavailable, using fallback calculation:', mlError.message);
      
      // Enhanced fallback formula
      const industryMultipliers = {
        'FinTech': 10,
        'Cybersecurity': 9,
        'HealthTech': 8,
        'EdTech': 6,
        'E-Commerce': 5,
        'Gaming': 5,
        'IoT': 7
      };
      
      const regionMultipliers = {
        'North America': 1.2,
        'Europe': 1.1,
        'Australia': 1.0,
        'South America': 0.9
      };
      
      const exitMultipliers = {
        'IPO': 1.5,
        'Private': 1.0
      };
      
      const baseMultiplier = industryMultipliers[industry] || 5;
      const regionMult = regionMultipliers[validatedRegion] || 1;
      const exitMult = exitMultipliers[validatedExitStatus] || 1;
      const profitMult = profitable ? 1.3 : 1.0;
      
      // Fallback valuation calculation
      valuation_result = (
        (revenue * 1_000_000 * baseMultiplier) + 
        ((funding_amount || 0) * 1_000_000 * 2) +
        (employees * 50000) +
        ((market_share || 0) * 100000)
      ) * regionMult * exitMult * profitMult;
    }

    // Save to MongoDB
    const startupQuery = new StartupQuery({
      funding_rounds: funding_rounds || 1,
      funding_amount: funding_amount || 0,
      revenue,
      employees,
      market_share: market_share || 0,
      profitable: profitable || false,
      year_founded: year_founded || new Date().getFullYear(),
      industry,
      region: validatedRegion,
      exit_status: validatedExitStatus,
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
          funding_rounds: funding_rounds || 1,
          funding_amount: funding_amount || 0,
          revenue,
          employees,
          market_share: market_share || 0,
          profitable: profitable || false,
          year_founded: year_founded || new Date().getFullYear(),
          industry,
          region: validatedRegion,
          exit_status: validatedExitStatus
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
║   🚀 ValuAI Backend Server v2.0                ║
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
