import React, { useState, useEffect, useRef } from 'react';

/**
 * VisibilityWrapper provides safe component mounting/unmounting
 * Especially useful for mobile browsers where unmounting can cause issues
 */
const VisibilityWrapper = ({ 
  visible = true, 
  children, 
  className = '',
  duration = 300,
  unmountOnHide = true
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [shouldRender, setShouldRender] = useState(visible);
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    if (visible) {
      // When showing, render immediately then animate in
      setShouldRender(true);
      // Small delay to ensure DOM update before animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      // When hiding, animate out then unmount if needed
      setIsVisible(false);
      
      if (unmountOnHide) {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set timeout to unmount after animation completes
        timeoutRef.current = setTimeout(() => {
          setShouldRender(false);
        }, duration);
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, unmountOnHide]);
  
  // Render nothing if we shouldn't render at all
  if (!shouldRender) {
    return null;
  }
  
  // Otherwise, render with appropriate animation classes
  return (
    <div 
      className={`transition-opacity duration-${duration} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default VisibilityWrapper;
