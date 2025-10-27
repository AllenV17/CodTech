const mongoose = require('mongoose');

const trackingSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['productive', 'social', 'entertainment', 'news', 'shopping', 'other'],
    index: true
  },
  duration: {
    type: Number, // in milliseconds
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  pageData: {
    wordCount: Number,
    hasVideo: Boolean,
    hasAds: Boolean,
    pageType: String,
    loadTime: Number
  },
  scrollData: {
    maxScrollPercent: Number,
    timeOnPage: Number
  },
  clickData: {
    clickCount: Number,
    lastClickTime: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
trackingSessionSchema.index({ userId: 1, timestamp: -1 });
trackingSessionSchema.index({ userId: 1, category: 1, timestamp: -1 });
trackingSessionSchema.index({ domain: 1, timestamp: -1 });

// Virtual for formatted duration
trackingSessionSchema.virtual('formattedDuration').get(function() {
  const seconds = Math.floor(this.duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
});

// Static method to get user analytics
trackingSessionSchema.statics.getUserAnalytics = async function(userId, startDate, endDate) {
  const matchStage = {
    userId: userId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };

  const analytics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTime: { $sum: '$duration' },
        totalSessions: { $sum: 1 },
        categories: {
          $push: {
            category: '$category',
            duration: '$duration'
          }
        },
        domains: {
          $push: {
            domain: '$domain',
            duration: '$duration'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalTime: 1,
        totalSessions: 1,
        categoryBreakdown: {
          $reduce: {
            input: '$categories',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{
                      k: '$$this.category',
                      v: {
                        $add: [
                          { $ifNull: [{ $getField: { field: '$$this.category', input: '$$value' } }, 0] },
                          '$$this.duration'
                        ]
                      }
                    }]
                  ]
                }
              ]
            }
          }
        },
        domainBreakdown: {
          $reduce: {
            input: '$domains',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{
                      k: '$$this.domain',
                      v: {
                        $add: [
                          { $ifNull: [{ $getField: { field: '$$this.domain', input: '$$value' } }, 0] },
                          '$$this.duration'
                        ]
                      }
                    }]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);

  return analytics[0] || {
    totalTime: 0,
    totalSessions: 0,
    categoryBreakdown: {},
    domainBreakdown: {}
  };
};

module.exports = mongoose.model('TrackingSession', trackingSessionSchema);
