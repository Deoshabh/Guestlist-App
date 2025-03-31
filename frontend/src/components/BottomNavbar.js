import React, { useState, useEffect } from 'react';
import haptic from '../utils/haptic';

const BottomNavbar = ({ darkMode, toggleDarkMode }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      // Only hide on scroll down and show on scroll up
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Initialize active tab based on current view
  useEffect(() => {
    // Check which section is currently visible
    const determineActiveSection = () => {
      const scrollPosition = window.scrollY + 100;
      
      const homeSection = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow-md');
      const guestListSection = document.querySelector('.guest-list');
      const addGuestSection = document.querySelector('.guest-form');
      
      if (homeSection && scrollPosition < homeSection.offsetTop + homeSection.offsetHeight) {
        setActiveTab('home');
      } else if (addGuestSection && 
          scrollPosition >= addGuestSection.offsetTop && 
          scrollPosition < addGuestSection.offsetTop + addGuestSection.offsetHeight) {
        setActiveTab('add');
      } else if (guestListSection && 
          scrollPosition >= guestListSection.offsetTop) {
        setActiveTab('guests');
      }
    };
    
    // Initial determination
    determineActiveSection();
    
    // Set up scroll listener
    window.addEventListener('scroll', determineActiveSection, { passive: true });
    return () => window.removeEventListener('scroll', determineActiveSection);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Provide haptic feedback
    haptic.mediumFeedback();
    
    // Add scrolling behavior for navigation
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'guests') {
      const guestSection = document.querySelector('.guest-list') || document.querySelector('table');
      if (guestSection) {
        guestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (tab === 'add') {
      const addForm = document.querySelector('.guest-form');
      if (addForm) {
        addForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (tab === 'stats') {
      const statsSection = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
      if (statsSection) {
        statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (tab === 'settings') {
      // Show settings overlay or open menu
      const mobileMenuButton = document.querySelector('.mobile-menu-button');
      if (mobileMenuButton) {
        mobileMenuButton.click();
      }
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 z-50 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      {/* Active tab indicator - sliding bar at top */}
      <div className="relative h-0.5 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div 
          className="absolute h-full bg-primary transition-all duration-300 ease-in-out" 
          style={{ 
            width: '20%', 
            left: activeTab === 'home' ? '0%' : 
                 activeTab === 'guests' ? '20%' : 
                 activeTab === 'add' ? '40%' : 
                 activeTab === 'stats' ? '60%' : '80%' 
          }}
        ></div>
      </div>
      
      <div className="flex justify-around items-center h-16 px-4">
        {/* Home Button */}
        <button 
          onClick={() => handleTabChange('home')} 
          className={`flex flex-col items-center justify-center h-full w-16 transition-colors touch-target ${activeTab === 'home' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-14 0l2 2m0 0l7 7 7-7m-14 0l2-2" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </button>

        {/* Guests Button */}
        <button 
          onClick={() => handleTabChange('guests')} 
          className={`flex flex-col items-center justify-center h-full w-16 transition-colors touch-target ${activeTab === 'guests' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-xs mt-1">Guests</span>
        </button>

        {/* Add Guest Button with special styling and ripple effect */}
        <button 
          onClick={() => handleTabChange('add')} 
          className="flex flex-col items-center justify-center relative -top-5 transform hover:scale-105 active:scale-95 transition-transform"
        >
          <div className={`flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg overflow-hidden relative`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="absolute inset-0 bg-white/30 transform scale-0 rounded-full opacity-0 animate-ripple" id="ripple-effect"></span>
          </div>
          <span className="text-xs mt-1 text-primary font-medium">Add</span>
        </button>

        {/* Stats Button */}
        <button 
          onClick={() => handleTabChange('stats')} 
          className={`flex flex-col items-center justify-center h-full w-16 transition-colors touch-target ${activeTab === 'stats' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs mt-1">Stats</span>
        </button>

        {/* Settings Button */}
        <button 
          onClick={() => handleTabChange('settings')}
          className={`flex flex-col items-center justify-center h-full w-16 transition-colors touch-target ${activeTab === 'settings' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
      
      {/* Add a safe area for iOS devices */}
      <div className="h-safe-area bg-white dark:bg-gray-800"></div>
    </div>
  );
};

export default BottomNavbar;
