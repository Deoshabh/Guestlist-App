/**
 * Utility to monitor and manage connectivity state
 */

class ConnectivityManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.hasConnectivity = true; // Actual ability to reach servers
    this.listeners = [];
    this.checkInterval = null;
    this.lastCheck = Date.now();
    
    // Set up event listeners
    this.setupListeners();
  }
  
  setupListeners() {
    window.addEventListener('online', () => this.handleOnlineEvent());
    window.addEventListener('offline', () => this.handleOfflineEvent());
    
    // Start periodic connectivity checks
    this.startConnectivityChecks();
  }
  
  startConnectivityChecks() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    
    // Check connectivity every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 30000);
    
    // Initial check
    this.checkConnectivity();
  }
  
  stopConnectivityChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  async checkConnectivity() {
    try {
      // Try to fetch a tiny resource with cache busting
      const checkUrl = `/api/health?_=${Date.now()}`;
      
      // Use fetch with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(checkUrl, { 
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const hasConnectivity = response.ok;
      
      // Only notify if state changed
      if (this.hasConnectivity !== hasConnectivity) {
        this.hasConnectivity = hasConnectivity;
        this.notifyListeners();
      }
      
      this.lastCheck = Date.now();
      return hasConnectivity;
    } catch (error) {
      // Network error or timeout
      // Only update if we previously thought we had connectivity
      if (this.hasConnectivity) {
        this.hasConnectivity = false;
        this.notifyListeners();
      }
      
      this.lastCheck = Date.now();
      return false;
    }
  }
  
  handleOnlineEvent() {
    this.isOnline = true;
    // When device says we're online, verify with actual connectivity check
    this.checkConnectivity();
  }
  
  handleOfflineEvent() {
    this.isOnline = false;
    this.hasConnectivity = false;
    this.notifyListeners();
  }
  
  addListener(callback) {
    if (typeof callback === 'function' && !this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
    return () => this.removeListener(callback);
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  notifyListeners() {
    const status = {
      isOnline: this.isOnline,
      hasConnectivity: this.hasConnectivity,
      lastCheck: this.lastCheck
    };
    
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connectivity listener:', error);
      }
    });
  }
  
  getStatus() {
    return {
      isOnline: this.isOnline,
      hasConnectivity: this.hasConnectivity,
      lastCheck: this.lastCheck
    };
  }
}

// Create and export singleton instance
const connectivityManager = new ConnectivityManager();
export default connectivityManager;
