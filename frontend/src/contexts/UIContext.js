import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { safeGet } from '../utils/safeAccess';
import { applyMobilePatches } from '../utils/mobileCompatibility';
import haptic from '../utils/haptic';
import analytics from '../utils/analytics';

const UIContext = createContext();

export function useUI() {
  return useContext(UIContext);
}

// Utility to detect mobile devices with more reliability
const detectMobileDevice = () => {
  try {
    // Check via media query
    const isMobileByWidth = window.matchMedia('(max-width: 768px)').matches;
    
    // Check via touch capabilities
    const isTouchDevice = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 || 
                          safeGet(navigator, 'maxTouchPoints', 0) > 0;
    
    // Force desktop view via localStorage setting
    const forceDesktop = localStorage.getItem('forceDesktopView') === 'true';
    
    // Add more detailed logging for mobile detection
    if (process.env.NODE_ENV === 'development') {
      console.log('Mobile detection:', {
        width: window.innerWidth,
        isMobileByWidth,
        isTouchDevice,
        forceDesktop,
        userAgent: navigator.userAgent
      });
    }
    
    return isMobileByWidth && isTouchDevice && !forceDesktop;
  } catch (error) {
    console.error('Error detecting mobile device:', error);
    return false;
  }
};

export function UIProvider({ children }) {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [isMobile, setIsMobile] = useState(detectMobileDevice());
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  // Handle dark mode
  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', darkMode);
      localStorage.setItem('darkMode', darkMode);
      analytics.event('Settings', 'Toggle Dark Mode', darkMode ? 'On' : 'Off');
    } catch (error) {
      console.error('Error setting dark mode:', error);
    }
  }, [darkMode]);

  // Apply mobile patches
  useEffect(() => {
    try {
      if (isMobile) {
        console.log('📱 Applying mobile optimizations...');
        applyMobilePatches();
      }
    } catch (error) {
      console.error('Error applying mobile patches:', error);
    }
  }, [isMobile]);

  // Update mobile state on resize with debouncing
  useEffect(() => {
    let resizeTimeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newIsMobile = detectMobileDevice();
        if (newIsMobile !== isMobile) {
          console.log(`📱 Viewport: ${newIsMobile ? 'Mobile' : 'Desktop'}`);
          setIsMobile(newIsMobile);
        }
      }, 250);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isMobile]);

  // Handle bottom navbar clicks
  const handleBottomNavClick = (index) => {
    setActiveTabIndex(index);
    
    // Handle different tabs
    switch(index) {
      case 0: // Add
        document.querySelector('.guest-form')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 1: // List
        document.querySelector('.guest-list')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 2: // Groups
        document.querySelector('.guest-groups')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 3: // Stats
        document.querySelector('.stats-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 4: // Toggle Dark Mode
        toggleDarkMode();
        break;
      default:
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleDarkMode = useCallback(() => {
    haptic.lightFeedback();
    setDarkMode((prev) => !prev);
  }, []);

  // Add a visible indicator for forced desktop view
  const isDesktopForced = localStorage.getItem('forceDesktopView') === 'true' && 
                          (window.innerWidth <= 768 || navigator.maxTouchPoints > 0);

  const value = {
    darkMode,
    toggleDarkMode,
    isMobile,
    activeTabIndex,
    setActiveTabIndex,
    handleBottomNavClick,
    isDesktopForced
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}
