const express = require('express');
const TrackingSession = require('../models/TrackingSession');
const User = require('../models/User');
const router = express.Router();

// GET /api/analytics/:userId/dashboard - Get dashboard analytics
router.get('/:userId/dashboard', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '7d' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data
    const analytics = await TrackingSession.getUserAnalytics(userId, startDate, now);

    // Get daily breakdown for charts
    const dailyBreakdown = await TrackingSession.aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            category: "$category"
          },
          totalTime: { $sum: "$duration" },
          sessions: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          categories: {
            $push: {
              category: "$_id.category",
              time: "$totalTime",
              sessions: "$sessions"
            }
          },
          totalTime: { $sum: "$totalTime" },
          totalSessions: { $sum: "$sessions" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Get top domains
    const topDomains = await TrackingSession.aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: "$domain",
          totalTime: { $sum: "$duration" },
          sessions: { $sum: 1 },
          category: { $first: "$category" }
        }
      },
      { $sort: { totalTime: -1 } },
      { $limit: 10 }
    ]);

    // Get productivity score
    const productiveTime = analytics.categoryBreakdown.productive || 0;
    const unproductiveTime = (analytics.categoryBreakdown.social || 0) + 
                           (analytics.categoryBreakdown.entertainment || 0);
    const totalTime = analytics.totalTime;
    
    const productivityScore = totalTime > 0 ? 
      Math.round((productiveTime / totalTime) * 100) : 0;

    res.json({
      success: true,
      dashboard: {
        summary: {
          totalTime: analytics.totalTime,
          totalSessions: analytics.totalSessions,
          productivityScore,
          period: period
        },
        categoryBreakdown: analytics.categoryBreakdown,
        dailyBreakdown,
        topDomains,
        period: {
          startDate,
          endDate: now
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard analytics',
      message: error.message 
    });
  }
});

// GET /api/analytics/:userId/trends - Get trends analytics
router.get('/:userId/trends', async (req, res) => {
  try {
    const { userId } = req.params;
    const { metric = 'time', period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get trends data
    const trends = await TrackingSession.aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            category: "$category"
          },
          totalTime: { $sum: "$duration" },
          sessions: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          categories: {
            $push: {
              category: "$_id.category",
              time: "$totalTime",
              sessions: "$sessions"
            }
          },
          totalTime: { $sum: "$totalTime" },
          totalSessions: { $sum: "$sessions" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      success: true,
      trends,
      period: {
        startDate,
        endDate: now
      }
    });

  } catch (error) {
    console.error('Error fetching trends analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trends analytics',
      message: error.message 
    });
  }
});

// GET /api/analytics/:userId/insights - Get insights and recommendations
router.get('/:userId/insights', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get last 7 days data
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const analytics = await TrackingSession.getUserAnalytics(userId, weekAgo, new Date());

    const insights = [];
    const recommendations = [];

    // Analyze productivity
    const productiveTime = analytics.categoryBreakdown.productive || 0;
    const unproductiveTime = (analytics.categoryBreakdown.social || 0) + 
                           (analytics.categoryBreakdown.entertainment || 0);
    const totalTime = analytics.totalTime;

    if (totalTime > 0) {
      const productivityRatio = productiveTime / totalTime;
      
      if (productivityRatio > 0.7) {
        insights.push({
          type: 'positive',
          title: 'Great Productivity!',
          message: `You spent ${Math.round(productivityRatio * 100)}% of your time on productive activities.`
        });
      } else if (productivityRatio < 0.3) {
        insights.push({
          type: 'warning',
          title: 'Low Productivity',
          message: `Only ${Math.round(productivityRatio * 100)}% of your time was spent on productive activities.`
        });
        recommendations.push({
          type: 'productivity',
          title: 'Focus on Productive Sites',
          message: 'Try to limit time on entertainment and social media sites during work hours.'
        });
      }

      // Check daily goals
      const dailyAvgTime = totalTime / 7;
      const dailyProductiveGoal = user.settings.goals.dailyProductiveTime;
      
      if (dailyAvgTime > dailyProductiveGoal) {
        insights.push({
          type: 'info',
          title: 'Above Daily Goal',
          message: `You're averaging ${Math.round(dailyAvgTime / (60 * 60 * 1000) * 10) / 10} hours per day, above your goal of ${dailyProductiveGoal / (60 * 60 * 1000)} hours.`
        });
      }
    }

    // Analyze top domains
    const topDomains = Object.entries(analytics.domainBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (topDomains.length > 0) {
      const topDomain = topDomains[0];
      insights.push({
        type: 'info',
        title: 'Most Visited Site',
        message: `You spent the most time on ${topDomain[0]} (${Math.round(topDomain[1] / (60 * 60 * 1000) * 10) / 10} hours).`
      });
    }

    res.json({
      success: true,
      insights,
      recommendations,
      period: {
        startDate: weekAgo,
        endDate: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ 
      error: 'Failed to fetch insights',
      message: error.message 
    });
  }
});

module.exports = router;
