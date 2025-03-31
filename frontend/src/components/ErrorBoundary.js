import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isMobileError: false
    };
  }

  static getDerivedStateFromError(error) {
    // Check if it's likely a mobile-specific error
    const isMobileError = error?.message?.includes('map') || 
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
    this.setState({
      error,
      errorInfo,
      isMobileError
    });
    
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

  handleRetry() {
    this.setState({ error: null, errorInfo: null, isMobileError: false });
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
          <div className="flex flex-wrap space-x-2 space-y-2 sm:space-y-0">
            <button 
                onClick={this.handleRetry.bind(this)} 
                className="btn btn-primary"
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
                className="btn btn-secondary"
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
                className="btn btn-outline"
              >
                Return to Mobile View
              </button>
            )}
            
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-outline"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
