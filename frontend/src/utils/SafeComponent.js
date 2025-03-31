import React, { Component } from 'react';

/**
 * Higher-Order Component that provides error boundary protection
 * for individual components that might be prone to mobile issues
 */
const withErrorBoundary = (WrappedComponent) => {
  class SafeComponent extends Component {
    constructor(props) {
      super(props);
      this.state = { 
        hasError: false,
        error: null,
        errorInfo: null
      };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error(`Error in ${WrappedComponent.displayName || WrappedComponent.name || 'Component'}:`, error, errorInfo);
      this.setState({ errorInfo });
      
      // Apply quick fixes for common mobile errors
      this.attemptQuickFix(error);
    }
    
    attemptQuickFix(error) {
      try {
        const errorMsg = error.toString().toLowerCase();
        
        // Only apply fixes on mobile
        if (window.innerWidth > 768 && !navigator.maxTouchPoints) {
          return;
        }
        
        if (errorMsg.includes('map') || 
            errorMsg.includes('undefined is not an object') || 
            errorMsg.includes('null is not an object')) {
          
          // Apply array protections
          ['map', 'filter', 'forEach', 'find', 'some', 'every'].forEach(method => {
            const original = Array.prototype[method];
            Array.prototype[method] = function(...args) {
              if (!this) {
                console.log(`Local fix: ${method} called on null/undefined`);
                return method === 'map' || method === 'filter' ? [] : undefined;
              }
              return original.apply(this, args);
            };
          });
          
          // Try to auto-recover
          setTimeout(() => {
            this.setState({ hasError: false, error: null, errorInfo: null });
          }, 1000);
        }
      } catch (e) {
        console.error('Error applying quick fix:', e);
      }
    }

    render() {
      if (this.state.hasError) {
        // Simplified fallback UI
        return (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md my-2 border border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              This component encountered an error.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  }

  // Set display name for debugging
  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  SafeComponent.displayName = `SafeComponent(${wrappedName})`;

  return SafeComponent;
};

/**
 * Function Component wrapper for error boundaries
 * Use this to wrap components that might have mobile issues
 */
export const SafeComponent = ({ children, fallback }) => {
  if (React.isValidElement(children)) {
    const WrappedComponent = withErrorBoundary(
      () => children
    );
    return <WrappedComponent />;
  }
  
  return children;
};

// Higher Order Component syntax
export default withErrorBoundary;
