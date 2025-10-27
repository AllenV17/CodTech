const express = require('express');
const User = require('../models/User');
const router = express.Router();

// GET /api/users/:userId - Get user profile and settings
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.getOrCreateUser(userId);

    res.json({
      success: true,
      user: {
        userId: user.userId,
        settings: user.settings,
        stats: user.stats,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      message: error.message 
    });
  }
});

// PUT /api/users/:userId/settings - Update user settings
router.put('/:userId/settings', async (req, res) => {
  try {
    const { userId } = req.params;
    const { settings } = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update settings
    if (settings.enableTracking !== undefined) {
      user.settings.enableTracking = settings.enableTracking;
    }
    if (settings.enableAnalytics !== undefined) {
      user.settings.enableAnalytics = settings.enableAnalytics;
    }
    if (settings.categories) {
      user.settings.categories = { ...user.settings.categories, ...settings.categories };
    }
    if (settings.goals) {
      user.settings.goals = { ...user.settings.goals, ...settings.goals };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: user.settings
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ 
      error: 'Failed to update settings',
      message: error.message 
    });
  }
});

// POST /api/users/:userId/categories - Add custom category domains
router.post('/:userId/categories', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, domains } = req.body;

    if (!category || !domains || !Array.isArray(domains)) {
      return res.status(400).json({ 
        error: 'Missing required fields: category and domains array' 
      });
    }

    const validCategories = ['productive', 'social', 'entertainment', 'news', 'shopping'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add domains to category
    user.settings.categories[category] = [
      ...new Set([...user.settings.categories[category], ...domains])
    ];

    await user.save();

    res.json({
      success: true,
      message: `Added ${domains.length} domains to ${category} category`,
      categories: user.settings.categories
    });

  } catch (error) {
    console.error('Error adding category domains:', error);
    res.status(500).json({ 
      error: 'Failed to add category domains',
      message: error.message 
    });
  }
});

// DELETE /api/users/:userId/categories - Remove domains from category
router.delete('/:userId/categories', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, domains } = req.body;

    if (!category || !domains || !Array.isArray(domains)) {
      return res.status(400).json({ 
        error: 'Missing required fields: category and domains array' 
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove domains from category
    user.settings.categories[category] = user.settings.categories[category]
      .filter(domain => !domains.includes(domain));

    await user.save();

    res.json({
      success: true,
      message: `Removed ${domains.length} domains from ${category} category`,
      categories: user.settings.categories
    });

  } catch (error) {
    console.error('Error removing category domains:', error);
    res.status(500).json({ 
      error: 'Failed to remove category domains',
      message: error.message 
    });
  }
});

// GET /api/users/:userId/stats - Get user statistics
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate additional stats
    const now = new Date();
    const daysSinceCreated = Math.floor((now - user.createdAt) / (24 * 60 * 60 * 1000));
    const avgDailyTime = daysSinceCreated > 0 ? user.stats.totalTime / daysSinceCreated : 0;

    res.json({
      success: true,
      stats: {
        ...user.stats,
        daysSinceCreated,
        avgDailyTime,
        avgDailySessions: daysSinceCreated > 0 ? user.stats.totalSessions / daysSinceCreated : 0
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user stats',
      message: error.message 
    });
  }
});

module.exports = router;
