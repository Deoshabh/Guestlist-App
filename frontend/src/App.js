import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import MainLayout from './components/layouts/MainLayout';
import HomePage from './pages/HomePage';
import WhatsAppTemplatesPage from './pages/WhatsAppTemplatesPage';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { useNetwork } from './contexts/NetworkContext';
import { useGuests } from './contexts/GuestContext';
import { getBottomNavItems, getQuickActions } from './utils/navItems';
import haptic from './utils/haptic';
import { useToast } from './components/ToastManager';
import ErrorBoundary from './components/ErrorBoundary';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const { token, showRegister, setShowRegister, setToken } = useAuth();
  const { darkMode, setActiveTabIndex } = useUI();
  const { isOnline, API_BASE_URL } = useNetwork();
  const { guests } = useGuests();
  const toast = useToast();

  // Bottom navbar items
  const bottomNavItems = getBottomNavItems(darkMode);

  // Quick actions for mobile FAB
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
    </ErrorBoundary>
  );
}

export default App;