const express = require('express');
const TrackingSession = require('../models/TrackingSession');
const User = require('../models/User');
const router = express.Router();

// POST /api/tracking - Create new tracking session
router.post('/', async (req, res) => {
  try {
    const { userId, url, title, domain, category, duration, timestamp, pageData, scrollData, clickData } = req.body;

    // Validate required fields
    if (!userId || !url || !domain || !category) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, url, domain, category' 
      });
    }

    // Get or create user
    const user = await User.getOrCreateUser(userId);

    // Create tracking session
    const session = new TrackingSession({
      userId,
      url,
      title: title || 'Untitled',
      domain,
      category,
      duration: duration || 0,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      pageData,
      scrollData,
      clickData
    });

    await session.save();

    // Update user stats
    user.stats.totalSessions += 1;
    user.stats.totalTime += duration || 0;
    user.stats.lastActive = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      session: session,
      message: 'Tracking session created successfully'
    });

  } catch (error) {
    console.error('Error creating tracking session:', error);
    res.status(500).json({ 
      error: 'Failed to create tracking session',
      message: error.message 
    });
  }
});

// GET /api/tracking/:userId - Get user's tracking sessions
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, category, limit = 100, page = 1 } = req.query;

    // Build query
    const query = { userId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (category) {
      query.category = category;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const sessions = await TrackingSession
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await TrackingSession.countDocuments(query);

    res.json({
      success: true,
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching tracking sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tracking sessions',
      message: error.message 
    });
  }
});

// GET /api/tracking/:userId/summary - Get user's tracking summary
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await TrackingSession.getUserAnalytics(userId, start, end);

    res.json({
      success: true,
      analytics,
      period: {
        startDate: start,
        endDate: end
      }
    });

  } catch (error) {
    console.error('Error fetching tracking summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tracking summary',
      message: error.message 
    });
  }
});

// DELETE /api/tracking/:userId - Delete user's tracking data
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({ 
        error: 'Confirmation required. Send { "confirm": true } in request body.' 
      });
    }

    // Delete all tracking sessions for user
    const result = await TrackingSession.deleteMany({ userId });

    // Reset user stats
    const user = await User.findOne({ userId });
    if (user) {
      user.stats.totalSessions = 0;
      user.stats.totalTime = 0;
      await user.save();
    }

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} tracking sessions`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting tracking data:', error);
    res.status(500).json({ 
      error: 'Failed to delete tracking data',
      message: error.message 
    });
  }
});

module.exports = router;
