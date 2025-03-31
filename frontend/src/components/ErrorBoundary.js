import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to server or analytics if available
    if (window.gtag) {
      try {
        window.gtag('event', 'javascript_error', {
          'error_message': error.message,
          'error_stack': error.stack,
          'component': errorInfo.componentStack
        });
      } catch (loggingError) {
        console.error('Failed to log error to analytics:', loggingError);
      }
    }
  }
  handleRetry() {
    this.setState({ hasError: false, error: null, errorInfo: null });
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
            The application encountered an unexpected error. Please try again or refresh the page.
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
          <div className="flex space-x-2">
            <button 
              onClick={this.handleRetry} 
              className="btn btn-primary"
            >
              Try Again
            </button>
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
