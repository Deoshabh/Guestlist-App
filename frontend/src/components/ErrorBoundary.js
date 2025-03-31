import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isMobileError: false,
      recoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Check if it's likely a mobile-specific error
    const isMobileError = error?.message?.includes('map') || 
                          error?.message?.includes('undefined is not an object') ||
                          error?.message?.includes('null is not an object') ||
                          error?.stack?.includes('touch') ||
                          error?.stack?.includes('mobile') ||
                          error?.stack?.includes('BottomNavbar') ||
                          error?.stack?.includes('FloatingActionButton');
    
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      isMobileError
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Detect mobile-specific errors
    const errorString = error.toString().toLowerCase();
    const isMobileError = this.checkIfMobileError(errorString, errorInfo);
    
    // Set state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      isMobileError,
      recoveryAttempts: prevState.recoveryAttempts + 1
    }));
    
    // Log to analytics if available
    try {
      if (window.gtag) {
        window.gtag('event', 'error', {
          'event_category': 'Error Boundary',
          'event_label': error.toString(),
          'value': isMobileError ? 1 : 0
        });
      }
    } catch (e) {
      console.warn('Failed to log error to analytics:', e);
    }
    
    // Attempt auto-recovery for certain mobile errors after 2 seconds
    if (isMobileError && this.state.recoveryAttempts < 2) {
      setTimeout(() => {
        this.attemptAutoRecovery(errorString);
      }, 2000);
    }
  }
  
  checkIfMobileError(errorString, errorInfo) {
    // Check for common mobile-related errors
    const mobileErrorPatterns = [
      'map', 
      'undefined is not an object',
      'null is not an object',
      'cannot read property',
      'is not a function',
      'failed to execute',
      'touch',
      'swipe'
    ];
    
    // Check if error message contains mobile patterns
    const messageMatches = mobileErrorPatterns.some(pattern => 
      errorString.includes(pattern.toLowerCase())
    );
    
    // Check component stack for mobile components
    const stackMatches = errorInfo && errorInfo.componentStack && 
      (errorInfo.componentStack.includes('SwipeAction') || 
       errorInfo.componentStack.includes('Touch') ||
       errorInfo.componentStack.includes('Mobile') ||
       errorInfo.componentStack.includes('BottomSheet') ||
       errorInfo.componentStack.includes('BottomNav'));
    
    // Check if we're on a mobile device
    const isMobileDevice = window.innerWidth <= 768 || 
                          navigator.maxTouchPoints > 0 || 
                          ('ontouchstart' in window);
                          
    return (messageMatches || stackMatches) && isMobileDevice;
  }
  
  attemptAutoRecovery(errorString) {
    console.log('Attempting auto-recovery from error:', errorString);
    
    try {
      // Array-related fixes for common mobile issues
      if (errorString.includes('map') || 
          errorString.includes('undefined is not an object') || 
          errorString.includes('null is not an object')) {
        
        // Apply array protections
        ['map', 'filter', 'forEach', 'find', 'some', 'every'].forEach(method => {
          const original = Array.prototype[method];
          Array.prototype[method] = function(...args) {
            if (!this) {
              console.log(`Auto-recovery: Fixed ${method} called on null/undefined`);
              return method === 'map' || method === 'filter' ? [] : undefined;
            }
            return original.apply(this, args);
          };
        });
        
        // Try reset error state to recover the UI
        this.setState({ 
          hasError: false, 
          error: null, 
          errorInfo: null 
        });
      }
      
      // Touch event related errors
      if (errorString.includes('touch') || errorString.includes('event')) {
        // Remove event listeners that might be causing issues
        this.cleanupEventListeners();
        
        // Try reset error state to recover the UI
        this.setState({ 
          hasError: false, 
          error: null, 
          errorInfo: null 
        });
      }
    } catch (e) {
      console.error('Auto-recovery failed:', e);
    }
  }
  
  cleanupEventListeners() {
    try {
      // We can't remove specific listeners, but we can replace the handlers
      // with empty functions for problematic event types
      const safeListener = () => {};
      ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(type => {
        window.addEventListener(type, safeListener, { capture: true });
      });
      
      console.log('Replaced potentially problematic event listeners');
    } catch (e) {
      console.error('Failed to clean up event listeners:', e);
    }
  }

  handleRetry() {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      isMobileError: false 
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md my-4">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {this.state.isMobileError 
              ? "We've encountered an issue with the mobile view. Try switching to desktop view or refreshing the page."
              : "The application encountered an unexpected error. Please try again or refresh the page."
            }
          </p>
          {this.state.error && (
            <details className="mb-4">
              <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                {this.state.error.toString()}
                <hr className="my-2" />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <button 
              onClick={this.handleRetry.bind(this)} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Try Again
            </button>
            {this.state.isMobileError && (
              <button
                onClick={() => {
                  // Force desktop view by setting a localStorage flag
                  localStorage.setItem('forceDesktopView', 'true');
                  window.location.reload();
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Switch to Desktop View
              </button>
            )}
            
            {/* Add toggle button to switch back to mobile if already in desktop view */}
            {this.state.isMobileError && localStorage.getItem('forceDesktopView') === 'true' && (
              <button
                onClick={() => {
                  // Switch back to mobile view
                  localStorage.removeItem('forceDesktopView');
                  window.location.reload();
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Return to Mobile View
              </button>
            )}
            
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            >
              Reload Page
            </button>
            
            {/* Add a clear data option for persistent issues */}
            {this.state.recoveryAttempts > 1 && (
              <button
                onClick={() => {
                  try {
                    // Keep some important settings
                    const theme = localStorage.getItem('darkMode');
                    
                    // Clear storage
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Restore important settings
                    if (theme) {
                      localStorage.setItem('darkMode', theme);
                    }
                    
                    // Reload the page
                    window.location.reload();
                  } catch (e) {
                    console.error('Error clearing data:', e);
                    window.location.reload();
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Clear App Data & Reload
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
