import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      recoveryAttempts: 0
    };
    this.resetError = this.resetError.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState(prevState => ({ 
      errorInfo,
      recoveryAttempts: prevState.recoveryAttempts + 1
    }));
  }

  resetError() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }
  
  resetApp() {
    // Clear app data (use with caution)
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Force refresh
      window.location.reload();
    } catch (e) {
      console.error('Error clearing data:', e);
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center max-w-lg mx-auto my-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
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
            
            {this.state.recoveryAttempts > 1 && (
              <button 
                onClick={() => this.resetApp()}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                Reset App Data
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
