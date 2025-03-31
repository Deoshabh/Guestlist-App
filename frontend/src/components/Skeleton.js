import React from 'react';

/**
 * Skeleton Loading Component
 * Provides a placeholder UI while content is loading
 */
const Skeleton = ({ 
  type = 'rectangle', 
  width, 
  height, 
  circle = false,
  count = 1,
  className = ''
}) => {
  // Generate a random width for text skeletons if not specified
  const getRandomWidth = () => {
    return `${Math.floor(Math.random() * 50) + 50}%`;
  };
  
  // Get appropriate class based on type
  const getTypeClass = () => {
    if (circle) return 'rounded-full';
    
    switch (type) {
      case 'text':
        return 'h-4 rounded';
      case 'title':
        return 'h-6 rounded';
      case 'avatar':
        return 'rounded-full';
      case 'button':
        return 'h-10 rounded-md';
      case 'card':
        return 'h-32 rounded-lg';
      default:
        return 'rounded';
    }
  };
  
  // Generate a single skeleton item
  const renderSkeleton = (index) => {
    // Determine the styles
    let style = {};
    
    if (width) {
      style.width = width;
    } else if (type === 'text') {
      style.width = getRandomWidth();
    }
    
    if (height) {
      style.height = height;
    }
    
    if (circle && !height && !width) {
      style.width = '3rem';
      style.height = '3rem';
    }
    
    return (
      <div
        key={index}
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${getTypeClass()} ${className}`}
        style={style}
        aria-hidden="true"
      />
    );
  };
  
  // For multiple items, adjust spacing based on type
  if (count > 1) {
    const spacing = type === 'text' ? 'space-y-2' : 'space-y-4';
    
    return (
      <div className={spacing}>
        {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
      </div>
    );
  }
  
  // For single item
  return renderSkeleton(0);
};

/**
 * Skeleton for a card with text content
 */
Skeleton.Card = ({ lines = 3, className = '' }) => (
  <div className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
    <Skeleton type="title" className="mb-4 w-3/4" />
    <Skeleton type="text" count={lines} />
  </div>
);
Skeleton.Card.displayName = 'Skeleton.Card';
/**
 * Skeleton for a list item
 */
Skeleton.ListItem = ({ hasImage = true, lines = 2, className = '' }) => (
  <div className={`flex p-3 rounded-lg ${className}`}>
    {hasImage && (
      <Skeleton 
        circle 
        width="3rem" 
        height="3rem" 
        className="flex-shrink-0 mr-3" 
      />
    )}
    <div className="flex-grow">
      <Skeleton type="title" className="mb-2" />
      <Skeleton type="text" count={lines} />
    </div>
  </div>
);
Skeleton.ListItem.displayName = 'Skeleton.ListItem';
/**
 * Skeleton for a table
 */
Skeleton.Table = ({ rows = 5, columns = 3, className = '' }) => (
  <div className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
    {/* Table header */}
    <div className="bg-gray-50 dark:bg-gray-800 p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, idx) => (
        <Skeleton key={`header-${idx}`} type="text" className="h-6" />
      ))}
    </div>
    
    {/* Table rows */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div 
          key={`row-${rowIdx}`} 
          className="p-4 grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton 
              key={`cell-${rowIdx}-${colIdx}`} 
              type="text" 
              className="h-4"
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);
Skeleton.Table.displayName = 'Skeleton.Table';
// Set display name for main component
Skeleton.displayName = 'Skeleton';

export default Skeleton;


