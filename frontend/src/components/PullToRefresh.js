import React, { useState, useEffect, useCallback } from 'react';

const PullToRefresh = ({ onRefresh, disabled = false, pullDistance = 80, children }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  // Reset when done refreshing
  useEffect(() => {
    if (!isPulling && pullY === 0) {
      setIsRefreshing(false);
    }
  }, [isPulling, pullY]);

  const handleTouchStart = useCallback((e) => {
    if (disabled || window.scrollY > 5) return;
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || disabled) return;
    
    const y = e.touches[0].clientY - startY;
    // Only allow pulling down, not up
    if (y > 0) {
      // Use a logarithmic function to create resistance as user pulls further
      const newPullY = Math.min(Math.log(y) * 15, pullDistance);
      setPullY(newPullY);
    } else {
      setPullY(0);
    }
  }, [isPulling, disabled, startY, pullDistance]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling || disabled) return;
    
    if (pullY >= pullDistance / 2) {
      // User pulled enough to trigger refresh
      setIsRefreshing(true);
      onRefresh().finally(() => {
        // After refresh is done, reset
        setTimeout(() => {
          setPullY(0);
          setIsPulling(false);
        }, 300);
      });
    } else {
      // Not pulled enough, reset
      setPullY(0);
      setIsPulling(false);
    }
  }, [isPulling, disabled, pullY, pullDistance, onRefresh]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullY / pullDistance, 1);

  return (
    <div className="pull-to-refresh-container">
      {/* Pull indicator */}
      <div 
        className={`fixed top-0 left-0 right-0 flex justify-center items-center overflow-hidden z-50 transition-all duration-300 bg-primary/10 ${pullY > 0 ? 'visible' : 'invisible'}`}
        style={{ height: `${pullY}px` }}
      >
        <div className="text-primary flex items-center">
          {isRefreshing ? (
            <svg className="animate-spin h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg 
              className="h-6 w-6 mr-2 transition-transform duration-200" 
              style={{ transform: `rotate(${progress * 180}deg)` }}
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {isRefreshing ? 'Refreshing...' : progress >= 0.8 ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      </div>
      
      {/* Content */}
      <div style={{ transform: `translateY(${pullY}px)`, transition: !isPulling ? 'transform 0.3s ease-out' : 'none' }}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
