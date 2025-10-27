// Enhanced Popup Manager for TimeTracker Pro
class AdvancedPopupManager {
  constructor() {
    this.analyticsData = null;
    this.currentTab = null;
    this.updateInterval = null;
    this.init();
  }

  async init() {
    console.log('🚀 TimeTracker Pro Popup Initializing...');
    
    this.setupEventListeners();
    await this.loadAnalyticsData();
    await this.getCurrentTab();
    this.updateUI();
    this.startRealTimeUpdates();
    
    console.log('✅ TimeTracker Pro Popup Ready');
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Settings
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('exportData').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('clearData').addEventListener('click', () => {
      this.clearData();
    });

    document.getElementById('refreshInsights').addEventListener('click', () => {
      this.refreshInsights();
    });

    // Time period change
    document.getElementById('timePeriod').addEventListener('change', (e) => {
      this.updateAnalyticsForPeriod(e.target.value);
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Update content based on tab
    if (tabName === 'analytics') {
      this.updateAnalytics();
    } else if (tabName === 'insights') {
      this.updateInsights();
    }
  }

  async loadAnalyticsData() {
    try {
      // Get analytics data from background script
      const response = await chrome.runtime.sendMessage({ type: 'GET_ANALYTICS' });
      this.analyticsData = response;
    } catch (error) {
      console.error('Error loading analytics data:', error);
      this.analyticsData = this.getDefaultAnalyticsData();
    }
  }

  async getCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        this.currentTab = tabs[0];
      }
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }

  updateUI() {
    this.updateOverview();
    this.updateCurrentSession();
    this.updateProductivityScore();
  }

  updateOverview() {
    if (!this.analyticsData) return;

    const { dailyStats } = this.analyticsData;
    
    // Update main stats
    document.getElementById('todayTime').textContent = this.formatTime(dailyStats.totalTime || 0);
    document.getElementById('todaySessions').textContent = dailyStats.sessions || 0;
    
    const productiveTime = dailyStats.categories?.productive?.time || 0;
    const unproductiveTime = (dailyStats.categories?.social?.time || 0) + 
                            (dailyStats.categories?.entertainment?.time || 0);
    
    document.getElementById('productiveTime').textContent = this.formatTime(productiveTime);
    document.getElementById('unproductiveTime').textContent = this.formatTime(unproductiveTime);

    // Update category breakdown
    this.updateCategoryBreakdown(dailyStats.categories || {});
    
    // Update top sites
    this.updateTopSites(dailyStats.domains || {});
  }

  updateCurrentSession() {
    if (!this.analyticsData?.currentSession) {
      document.getElementById('currentSite').textContent = 'No active session';
      document.getElementById('currentCategory').textContent = '-';
      document.getElementById('currentTime').textContent = '0m 0s';
      return;
    }

    const session = this.analyticsData.currentSession;
    document.getElementById('currentSite').textContent = session.domain;
    document.getElementById('currentCategory').textContent = session.category;
    document.getElementById('currentCategory').className = `session-category ${session.category}`;
    document.getElementById('currentTime').textContent = this.formatTime(session.duration);
  }

  updateProductivityScore() {
    const score = this.analyticsData?.productivityScore || 0;
    document.getElementById('productivityScore').querySelector('.score-value').textContent = `${score}%`;
    
    // Update score color based on value
    const scoreElement = document.getElementById('productivityScore');
    scoreElement.className = `productivity-score ${this.getScoreClass(score)}`;
  }

  updateCategoryBreakdown(categories) {
    const container = document.getElementById('categoryList');
    container.innerHTML = '';

    const totalTime = Object.values(categories).reduce((sum, cat) => sum + (cat.time || 0), 0);
    
    Object.entries(categories)
      .sort(([,a], [,b]) => (b.time || 0) - (a.time || 0))
      .forEach(([category, data]) => {
        const percentage = totalTime > 0 ? Math.round((data.time / totalTime) * 100) : 0;
        
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
          <div class="category-info">
            <span class="category-name ${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
            <span class="category-sessions">${data.sessions || 0} sessions</span>
          </div>
          <div class="category-stats">
            <span class="category-time">${this.formatTime(data.time || 0)}</span>
            <span class="category-percentage">${percentage}%</span>
          </div>
          <div class="category-bar">
            <div class="category-progress" style="width: ${percentage}%; background-color: ${this.getCategoryColor(category)};"></div>
          </div>
        `;
        container.appendChild(categoryItem);
      });
  }

  updateTopSites(domains) {
    const container = document.getElementById('topSitesList');
    container.innerHTML = '';

    const sortedDomains = Object.entries(domains)
      .sort(([,a], [,b]) => (b.time || 0) - (a.time || 0))
      .slice(0, 5);

    sortedDomains.forEach(([domain, data], index) => {
      const siteItem = document.createElement('div');
      siteItem.className = 'site-item';
      siteItem.innerHTML = `
        <div class="site-rank">${index + 1}</div>
        <div class="site-info">
          <div class="site-name">${domain}</div>
          <div class="site-category ${data.category}">${data.category}</div>
        </div>
        <div class="site-stats">
          <div class="site-time">${this.formatTime(data.time || 0)}</div>
          <div class="site-sessions">${data.sessions || 0} sessions</div>
        </div>
      `;
      container.appendChild(siteItem);
    });
  }

  updateAnalytics() {
    // Update detailed analytics view
    this.updateDetailedStats();
    this.updateTimeChart();
  }

  updateDetailedStats() {
    if (!this.analyticsData?.dailyStats) return;

    const stats = this.analyticsData.dailyStats;
    
    // Calculate additional metrics
    const avgSessionDuration = stats.sessions > 0 ? stats.totalTime / stats.sessions : 0;
    const longestSession = Math.max(...Object.values(stats.domains || {}).map(d => d.time || 0));
    
    document.getElementById('avgSessionDuration').textContent = this.formatTime(avgSessionDuration);
    document.getElementById('longestSession').textContent = this.formatTime(longestSession);
    document.getElementById('focusScore').textContent = `${this.analyticsData.productivityScore || 0}%`;
    
    // Calculate distraction level
    const unproductiveTime = (stats.categories?.social?.time || 0) + 
                            (stats.categories?.entertainment?.time || 0);
    const distractionLevel = this.calculateDistractionLevel(unproductiveTime, stats.totalTime);
    document.getElementById('distractionLevel').textContent = distractionLevel;
    
    // Calculate goal progress
    const productiveTime = stats.categories?.productive?.time || 0;
    const goalProgress = Math.min(Math.round((productiveTime / (4 * 60 * 60 * 1000)) * 100), 100);
    document.getElementById('goalProgress').textContent = `${goalProgress}%`;
  }

  updateTimeChart() {
    const canvas = document.getElementById('timeChart');
    const ctx = canvas.getContext('2d');
    
    if (!this.analyticsData?.dailyStats?.categories) return;
    
    const categories = this.analyticsData.dailyStats.categories;
    const maxTime = Math.max(...Object.values(categories).map(cat => cat.time || 0));
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = canvas.width / Object.keys(categories).length;
    let x = 0;
    
    Object.entries(categories).forEach(([category, data]) => {
      const height = maxTime > 0 ? (data.time / maxTime) * (canvas.height - 40) : 0;
      const y = canvas.height - height - 20;
      
      ctx.fillStyle = this.getCategoryColor(category);
      ctx.fillRect(x + 5, y, barWidth - 10, height);
      
      ctx.fillStyle = '#333';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(category.charAt(0).toUpperCase(), x + barWidth/2, canvas.height - 5);
      
      x += barWidth;
    });
  }

  updateInsights() {
    this.updateAlerts();
    this.updateRecommendations();
    this.updatePatterns();
  }

  updateAlerts() {
    const container = document.getElementById('alertsList');
    container.innerHTML = '';

    const alerts = this.analyticsData?.alerts || [];
    
    if (alerts.length === 0) {
      container.innerHTML = '<div class="no-alerts">No recent alerts</div>';
      return;
    }

    alerts.slice(0, 5).forEach(alert => {
      const alertItem = document.createElement('div');
      alertItem.className = `alert-item ${alert.level}`;
      alertItem.innerHTML = `
        <div class="alert-message">${alert.message}</div>
        <div class="alert-time">${this.formatTimeAgo(alert.timestamp)}</div>
      `;
      container.appendChild(alertItem);
    });
  }

  updateRecommendations() {
    const container = document.getElementById('insightsList');
    container.innerHTML = '';

    const recommendations = this.generateRecommendations();
    
    recommendations.forEach(rec => {
      const recItem = document.createElement('div');
      recItem.className = 'insight-item';
      recItem.innerHTML = `
        <div class="insight-icon">${rec.icon}</div>
        <div class="insight-content">
          <div class="insight-title">${rec.title}</div>
          <div class="insight-description">${rec.description}</div>
        </div>
      `;
      container.appendChild(recItem);
    });
  }

  updatePatterns() {
    const container = document.getElementById('patternsList');
    container.innerHTML = '';

    const patterns = this.generatePatterns();
    
    patterns.forEach(pattern => {
      const patternItem = document.createElement('div');
      patternItem.className = 'pattern-item';
      patternItem.innerHTML = `
        <div class="pattern-title">${pattern.title}</div>
        <div class="pattern-description">${pattern.description}</div>
      `;
      container.appendChild(patternItem);
    });
  }

  generateRecommendations() {
    const recommendations = [];
    const stats = this.analyticsData?.dailyStats;
    
    if (!stats) return recommendations;

    const productiveTime = stats.categories?.productive?.time || 0;
    const unproductiveTime = (stats.categories?.social?.time || 0) + 
                            (stats.categories?.entertainment?.time || 0);
    
    if (productiveTime < 2 * 60 * 60 * 1000) { // Less than 2 hours
      recommendations.push({
        icon: '🎯',
        title: 'Increase Focus Time',
        description: 'Try to spend more time on productive activities like work or learning.'
      });
    }
    
    if (unproductiveTime > 3 * 60 * 60 * 1000) { // More than 3 hours
      recommendations.push({
        icon: '⚠️',
        title: 'Reduce Distractions',
        description: 'Consider limiting time on social media and entertainment sites.'
      });
    }
    
    if (stats.sessions > 30) {
      recommendations.push({
        icon: '🔄',
        title: 'Reduce Tab Switching',
        description: 'You\'re switching between sites frequently. Try to focus on fewer tabs.'
      });
    }

    return recommendations;
  }

  generatePatterns() {
    const patterns = [];
    const stats = this.analyticsData?.dailyStats;
    
    if (!stats) return patterns;

    // Most active category
    const topCategory = Object.entries(stats.categories || {})
      .sort(([,a], [,b]) => (b.time || 0) - (a.time || 0))[0];
    
    if (topCategory) {
      patterns.push({
        title: 'Most Active Category',
        description: `You spend most time on ${topCategory[0]} activities (${this.formatTime(topCategory[1].time)})`
      });
    }

    // Session frequency
    const avgSessionTime = stats.sessions > 0 ? stats.totalTime / stats.sessions : 0;
    patterns.push({
      title: 'Session Pattern',
      description: `Average session duration: ${this.formatTime(avgSessionTime)}`
    });

    return patterns;
  }

  startRealTimeUpdates() {
    // Update every 5 seconds
    this.updateInterval = setInterval(async () => {
      await this.loadAnalyticsData();
      this.updateUI();
    }, 5000);
  }

  async refreshInsights() {
    await this.loadAnalyticsData();
    this.updateInsights();
  }

  async saveSettings() {
    const settings = {
      enableTracking: document.getElementById('enableTracking').checked,
      enableNotifications: document.getElementById('enableNotifications').checked,
      enableAlerts: document.getElementById('enableAlerts').checked,
      productiveGoal: parseInt(document.getElementById('productiveGoal').value) * 60 * 60 * 1000,
      unproductiveLimit: parseInt(document.getElementById('unproductiveLimit').value) * 60 * 60 * 1000
    };

    try {
      await chrome.storage.local.set({ settings });
      this.showSuccessMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showErrorMessage('Failed to save settings');
    }
  }

  async exportData() {
    try {
      const data = await chrome.storage.local.get();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetracker-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showSuccessMessage('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showErrorMessage('Failed to export data');
    }
  }

  async clearData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await chrome.storage.local.clear();
        await this.loadAnalyticsData();
        this.updateUI();
        this.showSuccessMessage('Data cleared successfully!');
      } catch (error) {
        console.error('Error clearing data:', error);
        this.showErrorMessage('Failed to clear data');
      }
    }
  }

  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type) {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px;
      border-radius: 4px;
      color: white;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      z-index: 1000;
      font-size: 12px;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      document.body.removeChild(messageEl);
    }, 3000);
  }

  getDefaultAnalyticsData() {
    return {
      currentSession: null,
      dailyStats: {
        totalTime: 0,
        sessions: 0,
        categories: {},
        domains: {},
        productivityScore: 0
      },
      productivityScore: 0,
      alerts: [],
      totalSessions: 0,
      goals: {
        dailyProductiveTime: 4 * 60 * 60 * 1000,
        dailyLimitUnproductive: 2 * 60 * 60 * 1000,
        maxSessionsPerDay: 50
      }
    };
  }

  getScoreClass(score) {
    if (score >= 70) return 'excellent';
    if (score >= 50) return 'good';
    if (score >= 30) return 'fair';
    return 'poor';
  }

  getCategoryColor(category) {
    const colors = {
      productive: '#10b981',
      social: '#3b82f6',
      entertainment: '#f59e0b',
      news: '#8b5cf6',
      shopping: '#ef4444',
      other: '#6b7280',
    };
    return colors[category] || colors.other;
  }

  calculateDistractionLevel(unproductiveTime, totalTime) {
    if (totalTime === 0) return 'Low';
    
    const percentage = (unproductiveTime / totalTime) * 100;
    
    if (percentage >= 60) return 'High';
    if (percentage >= 40) return 'Medium';
    return 'Low';
  }

  formatTime(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  updateAnalyticsForPeriod(period) {
    // This would typically fetch data for different time periods
    // For now, we'll just update the display
    console.log('Updating analytics for period:', period);
  }
}

// Initialize popup manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AdvancedPopupManager();
});