const mongoose = require('mongoose');

const startupQuerySchema = new mongoose.Schema({
  // Core Financial Metrics
  funding_rounds: {
    type: Number,
    default: 1,
    min: [0, 'Funding rounds cannot be negative']
  },
  funding_amount: {
    type: Number,
    default: 0,
    min: [0, 'Funding amount cannot be negative']
  },
  revenue: {
    type: Number,
    required: [true, 'Revenue is required'],
    min: [0, 'Revenue cannot be negative']
  },
  
  // Company Metrics
  employees: {
    type: Number,
    required: [true, 'Number of employees is required'],
    min: [1, 'Must have at least 1 employee']
  },
  market_share: {
    type: Number,
    default: 0,
    min: [0, 'Market share cannot be negative'],
    max: [100, 'Market share cannot exceed 100%']
  },
  profitable: {
    type: Boolean,
    default: false
  },
  year_founded: {
    type: Number,
    default: () => new Date().getFullYear(),
    min: [1900, 'Year founded seems too old'],
    max: [new Date().getFullYear(), 'Year founded cannot be in the future']
  },
  
  // Categorical Fields
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true,
    enum: {
      values: ['Cybersecurity', 'E-Commerce', 'EdTech', 'FinTech', 'Gaming', 'HealthTech', 'IoT'],
      message: '{VALUE} is not a valid industry'
    }
  },
  region: {
    type: String,
    default: 'North America',
    trim: true,
    enum: {
      values: ['Australia', 'Europe', 'North America', 'South America'],
      message: '{VALUE} is not a valid region'
    }
  },
  exit_status: {
    type: String,
    default: 'Private',
    trim: true,
    enum: {
      values: ['IPO', 'Private'],
      message: '{VALUE} is not a valid exit status'
    }
  },
  
  // Result
  valuation_result: {
    type: Number,
    default: null
  },
  
  // Legacy field for backwards compatibility
  team_size: {
    type: Number,
    min: [1, 'Team size must be at least 1']
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Pre-save middleware to sync team_size with employees
startupQuerySchema.pre('save', function(next) {
  if (this.employees && !this.team_size) {
    this.team_size = this.employees;
  }
  if (this.team_size && !this.employees) {
    this.employees = this.team_size;
  }
  next();
});

// Index for efficient queries
startupQuerySchema.index({ createdAt: -1 });
startupQuerySchema.index({ industry: 1 });
startupQuerySchema.index({ region: 1 });

const StartupQuery = mongoose.model('StartupQuery', startupQuerySchema);

module.exports = StartupQuery;
