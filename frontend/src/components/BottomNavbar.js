import React, { useEffect, useState } from 'react';
import haptic from '../utils/haptic';

const BottomNavbar = ({ items = [], activeIdx, onItemClick }) => {
  // Ensure items is never undefined
  const safeItems = Array.isArray(items) ? items : [];
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Handle scroll behavior - hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        // Always show at top of page
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide
        setIsVisible(false);
      } else {
        // Scrolling up - show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    // Add scroll listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);
  
  // Handle nav item clicks with protection against double-clicks
  const handleNavItemClick = (idx) => {
    try {
      console.log('Nav item clicked:', idx);
      
      // Provide haptic feedback
      if (haptic && typeof haptic.lightFeedback === 'function') {
        haptic.lightFeedback();
      }
      
      // Call the parent handler
      if (typeof onItemClick === 'function') {
        onItemClick(idx);
      } else {
        console.warn('onItemClick is not a function');
      }
    } catch (err) {
      console.error('Error in nav item click:', err);
    }
  };
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom transition-transform duration-300 ${
        isVisible ? 'transform-none' : 'transform translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 h-14">
        {safeItems.map((item, idx) => (
          <button
            key={idx}
            className={`flex flex-col items-center justify-center px-1 py-2 focus:outline-none touch-manipulation ${
              idx === activeIdx
                ? 'text-primary dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => handleNavItemClick(idx)}
            aria-label={item?.label || `Item ${idx}`}
          >
            {item.icon}
            <span className="text-xs mt-1 truncate max-w-full px-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavbar;
