import React, { useState, useRef, useEffect } from 'react';
import haptic from '../utils/haptic';

const SwipeAction = ({ 
  children, 
  leftActions = [], 
  rightActions = [],
  threshold = 0.4,
  disabled = false
}) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const elementRef = useRef(null);
  
  // Calculate max swipe distances
  const leftActionsWidth = leftActions.length * 70; // 70px per action
  const rightActionsWidth = rightActions.length * 70;
  
  // Reset position when disabled changes
  useEffect(() => {
    if (disabled) {
      setOffsetX(0);
      setCurrentX(0);
    }
  }, [disabled]);
  
  // Handle touch start
  const handleTouchStart = (e) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };
  
  // Handle touch move
  const handleTouchMove = (e) => {
    if (!isSwiping || disabled) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX + offsetX;
    
    // Add resistance if trying to swipe beyond the actions width
    const maxLeft = leftActionsWidth;
    const maxRight = -rightActionsWidth;
    
    let newX = diff;
    if (diff > maxLeft) {
      newX = maxLeft + (diff - maxLeft) * 0.2;
    } else if (diff < maxRight) {
      newX = maxRight + (diff - maxRight) * 0.2;
    }
    
    setCurrentX(newX);
  };
  
  // Handle touch end
  const handleTouchEnd = () => {
    if (!isSwiping || disabled) return;
    setIsSwiping(false);
    
    // Calculate threshold distances
    const leftThreshold = leftActionsWidth * threshold;
    const rightThreshold = -rightActionsWidth * threshold;
    
    let newOffsetX = 0;
    if (currentX > leftThreshold) {
      newOffsetX = leftActionsWidth;
      haptic.mediumFeedback();
    } else if (currentX < rightThreshold) {
      newOffsetX = -rightActionsWidth;
      haptic.mediumFeedback();
    }
    
    setOffsetX(newOffsetX);
    setCurrentX(newOffsetX);
  };
  
  // Reset position
  const reset = () => {
    setOffsetX(0);
    setCurrentX(0);
  };
  
  // Execute action and reset
  const executeAction = (action) => {
    if (action.onPress) {
      haptic.mediumFeedback();
      action.onPress();
    }
    reset();
  };
  
  return (
    <div className="relative overflow-hidden touch-pan-y w-full">
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div className="absolute top-0 left-0 bottom-0 flex items-center">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => executeAction(action)}
              className={`h-full w-[70px] flex flex-col items-center justify-center ${action.bgColor || 'bg-blue-500'} text-white`}
              aria-label={action.label}
            >
              {action.icon}
              {action.label && <span className="text-xs mt-1">{action.label}</span>}
            </button>
          ))}
        </div>
      )}
      
      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div className="absolute top-0 right-0 bottom-0 flex items-center">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => executeAction(action)}
              className={`h-full w-[70px] flex flex-col items-center justify-center ${action.bgColor || 'bg-red-500'} text-white`}
              aria-label={action.label}
            >
              {action.icon}
              {action.label && <span className="text-xs mt-1">{action.label}</span>}
            </button>
          ))}
        </div>
      )}
      
      {/* Content */}
      <div
        ref={elementRef}
        className="relative bg-white dark:bg-gray-800 transition-transform duration-300 ease-out touch-pan-y"
        style={{
          transform: `translateX(${isSwiping ? currentX : currentX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeAction;
