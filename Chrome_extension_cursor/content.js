// Content script for page analysis
class PageAnalyzer {
  constructor() {
    this.init();
  }

  init() {
    // Analyze page content when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.analyzePage());
    } else {
      this.analyzePage();
    }

    // Track scroll behavior
    this.trackScroll();
    
    // Track clicks
    this.trackClicks();
  }

  analyzePage() {
    const pageData = {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      timestamp: Date.now(),
      wordCount: this.getWordCount(),
      hasVideo: this.hasVideoContent(),
      hasAds: this.hasAdvertisements(),
      pageType: this.detectPageType(),
      loadTime: this.getLoadTime()
    };

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'PAGE_ANALYSIS',
      data: pageData
    });
  }

  getWordCount() {
    const text = document.body.innerText || document.body.textContent || '';
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  hasVideoContent() {
    const videos = document.querySelectorAll('video');
    const iframes = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"]');
    return videos.length > 0 || iframes.length > 0;
  }

  hasAdvertisements() {
    const adSelectors = [
      '[class*="ad"]', '[id*="ad"]', '[class*="banner"]',
      '[class*="sponsor"]', '[class*="promo"]'
    ];
    
    return adSelectors.some(selector => 
      document.querySelector(selector) !== null
    );
  }

  detectPageType() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    
    if (url.includes('login') || url.includes('signin')) return 'login';
    if (url.includes('register') || url.includes('signup')) return 'register';
    if (url.includes('profile') || url.includes('account')) return 'profile';
    if (url.includes('search')) return 'search';
    if (url.includes('product') || url.includes('item')) return 'product';
    if (url.includes('article') || url.includes('blog')) return 'article';
    if (url.includes('video') || url.includes('watch')) return 'video';
    
    return 'general';
  }

  getLoadTime() {
    return performance.timing.loadEventEnd - performance.timing.navigationStart;
  }

  trackScroll() {
    let scrollStartTime = Date.now();
    let maxScroll = 0;
    
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      maxScroll = Math.max(maxScroll, scrollPercent);
    });

    // Send scroll data when user leaves page
    window.addEventListener('beforeunload', () => {
      const scrollData = {
        maxScrollPercent: maxScroll,
        timeOnPage: Date.now() - scrollStartTime,
        url: window.location.href
      };

      chrome.runtime.sendMessage({
        type: 'SCROLL_DATA',
        data: scrollData
      });
    });
  }

  trackClicks() {
    let clickCount = 0;
    
    document.addEventListener('click', (event) => {
      clickCount++;
      
      const clickData = {
        url: window.location.href,
        timestamp: Date.now(),
        clickCount: clickCount,
        target: event.target.tagName,
        className: event.target.className
      };

      chrome.runtime.sendMessage({
        type: 'CLICK_DATA',
        data: clickData
      });
    });
  }
}

// Initialize page analyzer
new PageAnalyzer();
