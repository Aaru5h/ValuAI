const mongoose = require('mongoose');

const startupQuerySchema = new mongoose.Schema({
  revenue: {
    type: Number,
    required: [true, 'Revenue is required'],
    min: [0, 'Revenue cannot be negative']
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  team_size: {
    type: Number,
    required: [true, 'Team size is required'],
    min: [1, 'Team size must be at least 1']
  },
  valuation_result: {
    type: Number,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for efficient queries
startupQuerySchema.index({ createdAt: -1 });
startupQuerySchema.index({ industry: 1 });

const StartupQuery = mongoose.model('StartupQuery', startupQuerySchema);

module.exports = StartupQuery;
