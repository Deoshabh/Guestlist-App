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
    this.handleRetry = this.handleRetry.bind(this);
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
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Add detailed logging for debugging mobile issues
    if (window.innerWidth <= 768) {
      console.log('Mobile environment details:',
        {
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          userAgent: navigator.userAgent,
          error: error.toString(),
          stack: error.stack
        }
      );
    }
    
    // Check if the error is related to analytics
    const isAnalyticsError = 
      (error.message && (
        error.message.includes('gtag') || 
        error.message.includes('analytics') || 
        error.message.includes('google') ||
        error.message.includes('rn.init')
      )) || 
      (errorInfo.componentStack && (
        errorInfo.componentStack.includes('analytics')
      ));
    
    // For analytics errors, log but don't show error UI
    if (isAnalyticsError) {
      console.warn('Analytics-related error (non-critical):', error);
      // Reset error state so UI continues to function
      this.setState({ hasError: false });
      return;
    }
    
    // Try to log to analytics if available
    if (window.gtag) {
      try {
        window.gtag('event', 'javascript_error', {
          'error_message': error.message,
          'error_stack': error.stack,
          'component': errorInfo.componentStack,
          'is_mobile': window.innerWidth <= 768 ? 'yes' : 'no'
        });
      } catch (loggingError) {
        console.error('Failed to log error to analytics:', loggingError);
      }
    }
  }

  handleRetry() {
    this.setState({ hasError: false, error: null, errorInfo: null, isMobileError: false });
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
              onClick={this.handleRetry} 
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
