/**
 * Network service that replaces offline functionality
 * This is a compatibility layer that always reports online status
 */

class NetworkService {
  /**
   * Check if the application is online
   * In this version, always returns true as we've removed offline functionality
   * @returns {boolean} Always true
   */
  isOnline() {
    return true;
  }

  /**
   * Add network status listener (compatibility method)
   * @param {Function} listener - The listener function
   * @returns {Function} Function to remove the listener (no-op in this version)
   */
  addStatusListener(listener) {
    // Immediately call with online status
    setTimeout(() => {
      listener({ online: true });
    }, 0);
    
    // Return a no-op cleanup function
    return () => {};
  }
}

// Create and export a singleton instance
const networkService = new NetworkService();
export default networkService;
