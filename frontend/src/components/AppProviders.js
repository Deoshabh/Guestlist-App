import React from 'react';
import ErrorBoundary from './ErrorBoundary';

// This component exists to avoid an error with undefined AppProviders
// It's a simplified version that just provides error boundary
const AppProviders = ({ children }) => {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

export default AppProviders;
