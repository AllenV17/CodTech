// Enhanced Background Script for TimeTracker Pro - Simplified Version
class AdvancedTimeTracker {
  constructor() {
    this.activeTab = null;
    this.startTime = null;
    this.sessionData = new Map();
    this.dailyStats = new Map();
    this.productivityScore = 0;
    this.alerts = [];
    this.goals = {
      dailyProductiveTime: 4 * 60 * 60 * 1000, // 4 hours
      dailyLimitUnproductive: 2 * 60 * 60 * 1000, // 2 hours
      maxSessionsPerDay: 50
    };
    this.init();
  }

  async init() {
    console.log('🚀 TimeTracker Pro - Advanced Analytics Starting...');
    
    try {
      // Load saved data
      await this.loadStoredData();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up periodic tasks
      this.setupPeriodicTasks();
      
      // Initialize with current tab
      await this.initializeCurrentTab();
      
      console.log('✅ TimeTracker Pro initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing TimeTracker Pro:', error);
    }
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get([
        'sessionData', 'dailyStats', 'productivityScore', 'goals', 'alerts'
      ]);
      
      this.sessionData = new Map(result.sessionData || []);
      this.dailyStats = new Map(result.dailyStats || []);
      this.productivityScore = result.productivityScore || 0;
      this.goals = { ...this.goals, ...result.goals };
      this.alerts = result.alerts || [];
      
      console.log('📊 Loaded stored data:', {
        sessions: this.sessionData.size,
        dailyStats: this.dailyStats.size,
        productivityScore: this.productivityScore
      });
    } catch (error) {
      console.error('❌ Error loading stored data:', error);
    }
  }

  async saveData() {
    try {
      await chrome.storage.local.set({
        sessionData: Array.from(this.sessionData.entries()),
        dailyStats: Array.from(this.dailyStats.entries()),
        productivityScore: this.productivityScore,
        goals: this.goals,
        alerts: this.alerts
      });
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  }

  setupEventListeners() {
    // Tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabChange(activeInfo.tabId);
    });

    // Tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        this.handleTabChange(tabId);
      }
    });

    // Window focus changes
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        this.handleWindowBlur();
      } else {
        this.handleWindowFocus();
      }
    });

    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  setupPeriodicTasks() {
    // Save data every 30 seconds
    setInterval(() => {
      this.saveData();
    }, 30000);

    // Update productivity score every minute
    setInterval(() => {
      this.updateProductivityScore();
    }, 60000);

    // Check goals every 5 minutes
    setInterval(() => {
      this.checkGoals();
    }, 300000);
  }

  async initializeCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await this.handleTabChange(tabs[0].id);
      }
    } catch (error) {
      console.error('❌ Error initializing current tab:', error);
    }
  }

  async handleTabChange(tabId) {
    try {
      // Save previous tab data
      if (this.activeTab && this.startTime) {
        await this.saveTabData(this.activeTab, Date.now() - this.startTime);
      }

      // Get new tab info
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url && !this.isChromeInternalUrl(tab.url)) {
        this.activeTab = tab;
        this.startTime = Date.now();
        await this.trackTab(tab);
      }
    } catch (error) {
      console.error('❌ Error handling tab change:', error);
    }
  }

  async handleWindowBlur() {
    if (this.activeTab && this.startTime) {
      await this.saveTabData(this.activeTab, Date.now() - this.startTime);
      this.startTime = null;
    }
  }

  async handleWindowFocus() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await this.handleTabChange(tabs[0].id);
      }
    } catch (error) {
      console.error('❌ Error handling window focus:', error);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'PAGE_ANALYSIS':
          await this.handlePageAnalysis(message.data, sender.tab);
          break;
        case 'SCROLL_DATA':
          await this.handleScrollData(message.data, sender.tab);
          break;
        case 'CLICK_DATA':
          await this.handleClickData(message.data, sender.tab);
          break;
        case 'GET_ANALYTICS':
          sendResponse(this.getAnalyticsData());
          break;
        case 'GET_DAILY_STATS':
          sendResponse(this.getDailyStats());
          break;
        case 'GET_PRODUCTIVITY_SCORE':
          sendResponse({ score: this.productivityScore });
          break;
        case 'GET_ALERTS':
          sendResponse(this.alerts);
          break;
        case 'CLEAR_ALERTS':
          this.alerts = [];
          await this.saveData();
          sendResponse({ success: true });
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
    }
  }

  async trackTab(tab) {
    const domain = this.extractDomain(tab.url);
    const category = await this.categorizeSite(domain);
    
    const sessionId = `${domain}_${Date.now()}`;
    const sessionInfo = {
      id: sessionId,
      url: tab.url,
      title: tab.title,
      domain: domain,
      category: category,
      timestamp: Date.now(),
      startTime: this.startTime,
      duration: 0,
      pageData: {},
      scrollData: {},
      clickData: {}
    };

    this.sessionData.set(sessionId, sessionInfo);
    
    // Update daily stats
    this.updateDailyStats(domain, category, 0);
    
    console.log(`📊 Tracking: ${domain} (${category})`);
  }

  async saveTabData(tab, duration) {
    if (duration < 1000) return; // Ignore sessions less than 1 second
    
    const domain = this.extractDomain(tab.url);
    const category = await this.categorizeSite(domain);
    
    const sessionId = `${domain}_${this.startTime}`;
    const sessionInfo = this.sessionData.get(sessionId);
    
    if (sessionInfo) {
      sessionInfo.duration = duration;
      sessionInfo.endTime = Date.now();
      this.sessionData.set(sessionId, sessionInfo);
      
      // Update daily stats
      this.updateDailyStats(domain, category, duration);
      
      // Check for alerts
      this.checkForAlerts(domain, category, duration);
      
      console.log(`💾 Saved session: ${domain} - ${this.formatTime(duration)}`);
    }
  }

  updateDailyStats(domain, category, duration) {
    const today = new Date().toDateString();
    const dayStats = this.dailyStats.get(today) || {
      totalTime: 0,
      sessions: 0,
      categories: {},
      domains: {},
      productivityScore: 0
    };
    
    dayStats.totalTime += duration;
    dayStats.sessions += 1;
    
    // Update category stats
    if (!dayStats.categories[category]) {
      dayStats.categories[category] = { time: 0, sessions: 0 };
    }
    dayStats.categories[category].time += duration;
    dayStats.categories[category].sessions += 1;
    
    // Update domain stats
    if (!dayStats.domains[domain]) {
      dayStats.domains[domain] = { time: 0, sessions: 0, category };
    }
    dayStats.domains[domain].time += duration;
    dayStats.domains[domain].sessions += 1;
    
    this.dailyStats.set(today, dayStats);
  }

  updateProductivityScore() {
    const today = new Date().toDateString();
    const dayStats = this.dailyStats.get(today);
    
    if (dayStats && dayStats.totalTime > 0) {
      const productiveTime = dayStats.categories.productive?.time || 0;
      const unproductiveTime = (dayStats.categories.social?.time || 0) + 
                              (dayStats.categories.entertainment?.time || 0);
      
      this.productivityScore = Math.round((productiveTime / dayStats.totalTime) * 100);
      dayStats.productivityScore = this.productivityScore;
      
      this.dailyStats.set(today, dayStats);
    }
  }

  checkGoals() {
    const today = new Date().toDateString();
    const dayStats = this.dailyStats.get(today);
    
    if (!dayStats) return;
    
    // Check productive time goal
    const productiveTime = dayStats.categories.productive?.time || 0;
    if (productiveTime >= this.goals.dailyProductiveTime) {
      this.addAlert('goal_achieved', '🎉 Daily productive time goal achieved!', 'success');
    }
    
    // Check unproductive time limit
    const unproductiveTime = (dayStats.categories.social?.time || 0) + 
                            (dayStats.categories.entertainment?.time || 0);
    if (unproductiveTime >= this.goals.dailyLimitUnproductive) {
      this.addAlert('limit_exceeded', '⚠️ Unproductive time limit exceeded!', 'warning');
    }
    
    // Check session limit
    if (dayStats.sessions >= this.goals.maxSessionsPerDay) {
      this.addAlert('session_limit', '📊 Daily session limit reached!', 'info');
    }
  }

  checkForAlerts(domain, category, duration) {
    // Alert for long sessions
    if (duration > 2 * 60 * 60 * 1000) { // 2 hours
      this.addAlert('long_session', 
        `⏰ Long session detected: ${domain} (${this.formatTime(duration)})`, 
        'info');
    }
    
    // Alert for excessive unproductive time
    if (category === 'entertainment' && duration > 30 * 60 * 1000) { // 30 minutes
      this.addAlert('excessive_entertainment', 
        `🎬 Long entertainment session: ${domain}`, 
        'warning');
    }
  }

  addAlert(type, message, level = 'info') {
    const alert = {
      id: Date.now(),
      type,
      message,
      level,
      timestamp: new Date().toISOString()
    };
    
    this.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
    
    // Show notification if permissions allow
    this.showNotification(alert);
  }

  showNotification(alert) {
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'TimeTracker Pro',
        message: alert.message
      });
    } catch (error) {
      console.log('Notification not available:', error);
    }
  }

  getAnalyticsData() {
    const today = new Date().toDateString();
    const dayStats = this.dailyStats.get(today) || {
      totalTime: 0,
      sessions: 0,
      categories: {},
      domains: {},
      productivityScore: 0
    };
    
    return {
      currentSession: this.activeTab ? {
        domain: this.extractDomain(this.activeTab.url),
        category: this.categorizeSite(this.extractDomain(this.activeTab.url)),
        duration: this.startTime ? Date.now() - this.startTime : 0
      } : null,
      dailyStats: dayStats,
      productivityScore: this.productivityScore,
      alerts: this.alerts.slice(0, 10), // Last 10 alerts
      totalSessions: this.sessionData.size,
      goals: this.goals
    };
  }

  getDailyStats() {
    return Array.from(this.dailyStats.entries()).map(([date, stats]) => ({
      date,
      ...stats
    }));
  }

  async handlePageAnalysis(data, tab) {
    // Handle page analysis data from content script
    console.log('Page analysis:', data);
  }

  async handleScrollData(data, tab) {
    // Handle scroll data from content script
    console.log('Scroll data:', data);
  }

  async handleClickData(data, tab) {
    // Handle click data from content script
    console.log('Click data:', data);
  }

  isChromeInternalUrl(url) {
    return url.startsWith('chrome://') || 
           url.startsWith('chrome-extension://') || 
           url.startsWith('moz-extension://') ||
           url.startsWith('edge://') ||
           url.startsWith('about:');
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (e) {
      return 'unknown';
    }
  }

  async categorizeSite(domain) {
    const categories = {
      productive: [
        'github.com', 'stackoverflow.com', 'developer.mozilla.org', 'w3schools.com',
        'codepen.io', 'jsfiddle.net', 'repl.it', 'codesandbox.io', 'notion.so',
        'trello.com', 'asana.com', 'slack.com', 'zoom.us', 'teams.microsoft.com',
        'google.com', 'docs.google.com', 'drive.google.com', 'calendar.google.com',
        'linkedin.com', 'coursera.org', 'udemy.com', 'khanacademy.org',
        'medium.com', 'dev.to', 'hashnode.com', 'freecodecamp.org',
        'openai.com', 'chatgpt.com', 'claude.ai', 'anthropic.com'
      ],
      social: [
        'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
        'snapchat.com', 'pinterest.com', 'reddit.com', 'discord.com',
        'telegram.org', 'whatsapp.com', 'signal.org'
      ],
      entertainment: [
        'youtube.com', 'netflix.com', 'hulu.com', 'disney.com',
        'twitch.tv', 'spotify.com', 'soundcloud.com', 'vimeo.com',
        'dailymotion.com', 'crunchyroll.com', 'primevideo.com',
        'hbo.com', 'paramount.com', 'peacock.com'
      ],
      news: [
        'cnn.com', 'bbc.com', 'reuters.com', 'nytimes.com',
        'washingtonpost.com', 'theguardian.com', 'bloomberg.com',
        'wsj.com', 'ft.com', 'economist.com'
      ],
      shopping: [
        'amazon.com', 'ebay.com', 'etsy.com', 'shopify.com',
        'walmart.com', 'target.com', 'bestbuy.com', 'costco.com',
        'homedepot.com', 'lowes.com'
      ]
    };

    for (const [category, domains] of Object.entries(categories)) {
      if (domains.some(d => domain.includes(d))) {
        return category;
      }
    }

    return 'other';
  }

  formatTime(milliseconds) {
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
}

// Initialize the advanced time tracker
try {
  new AdvancedTimeTracker();
} catch (error) {
  console.error('❌ Failed to initialize TimeTracker Pro:', error);
}