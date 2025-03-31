import React from 'react';
import { ToastProvider } from './ToastManager';
import { AuthProvider } from '../contexts/AuthContext';
import { UIProvider } from '../contexts/UIContext';
import { NetworkProvider } from '../contexts/NetworkContext';
import { GuestProvider } from '../contexts/GuestContext';
import ErrorBoundary from './ErrorBoundary';

const AppProviders = ({ children }) => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NetworkProvider>
            <UIProvider>
              <GuestProvider>
                {children}
              </GuestProvider>
            </UIProvider>
          </NetworkProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default AppProviders;
