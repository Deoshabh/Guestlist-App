import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Store error details in localStorage for debugging
    try {
      localStorage.setItem('lastError', JSON.stringify({
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Could not save error to localStorage:', e);
    }
  }

  resetError() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center max-w-lg mx-auto my-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {this.state.error && this.state.error.message}
          </p>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              Reload Page
            </button>
            <button 
              onClick={this.resetError}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Try Again
            </button>
            {this.props.showDetails && (
              <details className="mt-4 text-left p-2 bg-gray-100 dark:bg-gray-900 rounded-md">
                <summary className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs overflow-auto text-gray-700 dark:text-gray-300 p-2">
                  {this.state.error && this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
