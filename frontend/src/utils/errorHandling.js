/**
 * Consolidated error handling utilities
 * Combines functionality from ErrorBoundary and SafeComponent
 */
import React from 'react';

// Error boundary component for React component tree error handling
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // Optionally log to an error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong.</h2>
          <p>Please try again or contact support if the issue persists.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// SafeComponent HOC for individual component error handling
export function withErrorHandling(Component, fallback) {
  return class SafeComponent extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error, info) {
      console.error('Error in component:', error, info);
    }

    render() {
      if (this.state.hasError) {
        return fallback || <div>Something went wrong with this component.</div>;
      }
      return <Component {...this.props} />;
    }
  };
}

// Utility function to wrap any code with try/catch for non-React contexts
export function trySafe(fn, fallback = null) {
  try {
    return fn();
  } catch (error) {
    console.error('Error caught by trySafe:', error);
    return typeof fallback === 'function' ? fallback(error) : fallback;
  }
}
