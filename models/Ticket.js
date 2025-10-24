const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['maintenance', 'cleaning', 'medical', 'wifi', 'electricity', 'water', 'security', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'cancelled'],
    default: 'open'
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  images: [{
    url: String,
    publicId: String
  }],
  location: {
    roomNumber: String,
    block: String,
    specificLocation: String
  },
  aiAnalysis: {
    categoryConfidence: Number,
    priorityConfidence: Number,
    extractedKeywords: [String],
    suggestedActions: [String]
  },
  resolution: {
    description: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    images: [{
      url: String,
      publicId: String
    }]
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedResolutionTime: Date,
  actualResolutionTime: Date,
  escalationLevel: {
    type: Number,
    default: 0
  },
  lastEscalatedAt: Date
}, {
  timestamps: true
});

// Index for better query performance
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ student: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

// Virtual for resolution time
ticketSchema.virtual('resolutionTime').get(function() {
  if (this.resolution && this.resolution.resolvedAt) {
    return this.resolution.resolvedAt - this.createdAt;
  }
  return null;
});

// Method to check if ticket is overdue
ticketSchema.methods.isOverdue = function() {
  if (this.status === 'resolved' || this.status === 'closed') return false;
  
  const now = new Date();
  const hoursSinceCreated = (now - this.createdAt) / (1000 * 60 * 60);
  
  // Define overdue thresholds based on priority
  const thresholds = {
    urgent: 2,    // 2 hours
    high: 24,     // 1 day
    medium: 72,   // 3 days
    low: 168      // 1 week
  };
  
  return hoursSinceCreated > (thresholds[this.priority] || 72);
};

module.exports = mongoose.model('Ticket', ticketSchema);
