import React, { useState, useEffect, useRef } from 'react';

const VirtualList = ({ 
  items, 
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
  
  useEffect(() => {
    // Update visible items when items change
    updateVisibleItems();
  }, [items]);
  
  const updateVisibleItems = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, clientHeight } = containerRef.current;
    
    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1, 
      Math.floor((scrollTop + clientHeight) / itemHeight) + overscan
    );
    
    setStart(startIndex);
    
    const visibleItemsArray = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < items.length) {
        visibleItemsArray.push(items[i]);
      }
    }
    
    setVisibleItems(visibleItemsArray);
  };
  
  const handleScroll = () => {
    window.requestAnimationFrame(updateVisibleItems);
  };
  
  return (
    <div 
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div 
        style={{ 
          height: `${items.length * itemHeight}px`,
          position: 'relative'
        }}
      >
        {visibleItems.map((item, index) => (
          <div
            key={keyExtractor(item, start + index)}
            style={{
              position: 'absolute',
              top: `${(start + index) * itemHeight}px`,
              width: '100%',
              height: `${itemHeight}px`
            }}
          >
            {renderItem(item, start + index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualList;
