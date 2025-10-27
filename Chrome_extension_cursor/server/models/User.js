const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  settings: {
    enableTracking: {
      type: Boolean,
      default: true
    },
    enableAnalytics: {
      type: Boolean,
      default: true
    },
    categories: {
      productive: [String],
      social: [String],
      entertainment: [String],
      news: [String],
      shopping: [String]
    },
    goals: {
      dailyProductiveTime: {
        type: Number, // in milliseconds
        default: 4 * 60 * 60 * 1000 // 4 hours default
      },
      dailyLimitUnproductive: {
        type: Number, // in milliseconds
        default: 2 * 60 * 60 * 1000 // 2 hours default
      }
    }
  },
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    totalTime: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    streak: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get or create user
userSchema.statics.getOrCreateUser = async function(userId) {
  let user = await this.findOne({ userId });
  
  if (!user) {
    user = new this({
      userId,
      settings: {
        enableTracking: true,
        enableAnalytics: true,
        categories: {
          productive: [
            'github.com', 'stackoverflow.com', 'developer.mozilla.org', 'w3schools.com',
            'codepen.io', 'jsfiddle.net', 'repl.it', 'codesandbox.io', 'notion.so',
            'trello.com', 'asana.com', 'slack.com', 'zoom.us', 'teams.microsoft.com',
            'google.com', 'docs.google.com', 'drive.google.com', 'calendar.google.com',
            'linkedin.com', 'coursera.org', 'udemy.com', 'khanacademy.org',
            'medium.com', 'dev.to', 'hashnode.com', 'freecodecamp.org'
          ],
          social: [
            'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
            'snapchat.com', 'pinterest.com', 'reddit.com', 'discord.com'
          ],
          entertainment: [
            'youtube.com', 'netflix.com', 'hulu.com', 'disney.com',
            'twitch.tv', 'spotify.com', 'soundcloud.com', 'vimeo.com',
            'dailymotion.com', 'crunchyroll.com'
          ],
          news: [
            'cnn.com', 'bbc.com', 'reuters.com', 'nytimes.com',
            'washingtonpost.com', 'theguardian.com', 'bloomberg.com'
          ],
          shopping: [
            'amazon.com', 'ebay.com', 'etsy.com', 'shopify.com',
            'walmart.com', 'target.com', 'bestbuy.com'
          ]
        }
      }
    });
    await user.save();
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
