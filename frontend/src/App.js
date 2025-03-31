import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AppProviders from './components/AppProviders';
import MainLayout from './components/layouts/MainLayout';
import HomePage from './pages/HomePage';
import WhatsAppTemplatesPage from './pages/WhatsAppTemplatesPage';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { useNetwork } from './contexts/NetworkContext';
import { useGuests } from './contexts/GuestContext';
import { getBottomNavItems, getQuickActions } from './utils/navItems';
import axios from 'axios';
import db from './utils/db';
import syncManager from './utils/syncManager';
import haptic from './utils/haptic';
import { useToast } from './components/ToastManager';
import ConnectivityMonitor from './components/ConnectivityMonitor';
import analytics from './utils/analytics';
import ErrorBoundary from './components/ErrorBoundary';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function AppContent() {
  const { token, showRegister, setShowRegister, setToken } = useAuth();
  const { darkMode, setActiveTabIndex } = useUI();
  const { isOnline, API_BASE_URL } = useNetwork();
  const { guests } = useGuests();
  const toast = useToast();

  // Handle analytics initialization
  useEffect(() => {
    try {
      const analyticsId = process.env.REACT_APP_GA_ID || 'G-03XW3FWG7L';
      if (!localStorage.getItem('analytics_opt_out')) {
        analytics.init(analyticsId).catch((err) => {
          console.warn('Analytics initialization error (non-critical):', err);
        });
      }
    } catch (error) {
      console.warn('Failed to initialize analytics:', error);
    }
  }, []);

  // Bottom navbar items
  const bottomNavItems = getBottomNavItems(darkMode);

  // Quick actions for mobile FAB (Floating Action Button)
  const quickActions = getQuickActions(
    isOnline, 
    guests, 
    API_BASE_URL, 
    haptic, 
    toast, 
    setActiveTabIndex
  );

  // Disable analytics if there are issues
  useEffect(() => {
    try {
      // Block analytics to avoid CORS issues
      window.ga = function() {};
      window.gtag = function() {};
    } catch (error) {
      console.warn('Failed to block analytics:', error);
    }
  }, []);

  // Conditional rendering for authentication
  if (!token && showRegister) {
    return (
      <ErrorBoundary>
        <Register setToken={setToken} setShowRegister={setShowRegister} />
      </ErrorBoundary>
    );
  }
  
  if (!token) {
    return (
      <ErrorBoundary>
        <Login 
          setToken={setToken} 
          showRegister={showRegister} 
          setShowRegister={setShowRegister} 
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <MainLayout 
          quickActions={quickActions} 
          bottomNavItems={bottomNavItems}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/whatsapp-templates" element={<WhatsAppTemplatesPage />} />
              <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
            </Routes>
          </Suspense>
        </MainLayout>
      </Router>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AppProviders>
      <div className="App">
        <ConnectivityMonitor />
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </div>
    </AppProviders>
  );
}

export default App;