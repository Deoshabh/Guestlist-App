import React, { useState, useEffect, useRef, useCallback } from 'react';

const VirtualList = ({ 
  items = [], 
  renderItem, 
  itemHeight = 100, 
  overscan = 3,
  className = '',
  containerHeight = '400px',
  keyExtractor = (item, index) => index
}) => {
  const [start, setStart] = useState(0);
  const [visibleItems, setVisibleItems] = useState([]);
  const containerRef = useRef(null);
  
  const updateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, clientHeight } = containerRef.current;
    
    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1, 
      Math.floor((scrollTop + clientHeight) / itemHeight) + overscan
    );
    
    setStart(startIndex);
    
    // Get visible items to render
    setVisibleItems(
      items.slice(startIndex, endIndex + 1).map((item, index) => ({
        item,
        index: startIndex + index,
        key: keyExtractor(item, startIndex + index)
      }))
    );
  };
  
  const handleScroll = () => {
    window.requestAnimationFrame(updateVisibleItems);
  };
  
  // Add passive scrolling for better performance on mobile
  useEffect(() => {
    const currentRef = containerRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        currentRef.removeEventListener('scroll', handleScroll);
      };
    }
  }, [items, itemHeight, updateVisibleItems, handleScroll]);
  
  // Total height of all items
  const totalHeight = items.length * itemHeight;
  
  // Calculate offset for the visible items
  const offsetY = start * itemHeight;
  
  return (
    <div 
      ref={containerRef}
      className={`overflow-auto -webkit-overflow-scrolling-touch ${className}`}
      style={{ height: containerHeight, position: 'relative' }}
      data-testid="virtual-list-container"
    >
      {/* Spacer div to maintain scroll height */}
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {/* Container for visible items with correct offset */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, key, index }) => (
            <div key={key} style={{ height: `${itemHeight}px` }} data-index={index}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
      
      {/* No items message */}
      {items.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">No items to display</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(VirtualList); // Use memo for performance optimization
