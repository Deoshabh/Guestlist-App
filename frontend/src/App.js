import React, { useState, useEffect, useCallback } from 'react';
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

  // Conditional rendering for authentication
  if (!token && showRegister) {
    return <Register setToken={setToken} setShowRegister={setShowRegister} />;
  }
  
  if (!token) {
    return (
      <Login 
        setToken={setToken} 
        showRegister={showRegister} 
        setShowRegister={setShowRegister} 
      />
    );
  }

  return (
    <Router>
      <MainLayout 
        quickActions={quickActions} 
        bottomNavItems={bottomNavItems}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/whatsapp-templates" element={<WhatsAppTemplatesPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

function App() {
  return (
    <AppProviders>
      <div className="App">
        <ConnectivityMonitor />
        <AppContent />
      </div>
    </AppProviders>
  );
}

export default App;