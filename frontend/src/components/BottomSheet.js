import React, { useState, useEffect, useRef, useCallback } from 'react';
import haptic from '../utils/haptic';

const BottomSheet = ({ isOpen, onClose, title, children, height = '50vh' }) => {
  const [sheetHeight, setSheetHeight] = useState(height);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef(null);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff < 0) {
        // Dragging up - allow with resistance
        setSheetHeight(`calc(${height} - ${diff * 0.5}px)`);
      } else if (diff > 0) {
        // Dragging down
        setSheetHeight(`calc(${height} - ${diff}px)`);
      }
      
      setCurrentY(currentY);
    },
    [isDragging, startY, height]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    // If dragged down significantly, close the sheet
    if (currentY - startY > 100) {
      haptic.mediumFeedback();
      onClose();
    } else {
      // Reset to original height
      setSheetHeight(height);
    }
  }, [currentY, startY, onClose, height]);

  // Exit animation
  const handleTransitionEnd = (e) => {
    if (e.propertyName === 'transform' && !isOpen) {
      setSheetHeight(height);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out"
      style={{ opacity: isOpen ? 1 : 0 }}
    >
      <div 
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl shadow-xl transform transition-transform duration-300 ease-in-out overflow-hidden"
        style={{ 
          height: sheetHeight,
          maxHeight: '90vh',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Drag handle */}
        <div 
          className="w-full py-2 flex justify-center items-center cursor-grab"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
        
        {/* Title */}
        {title && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
