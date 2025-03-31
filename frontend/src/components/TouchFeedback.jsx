import React, { useState } from 'react';

/**
 * A component that wraps its children and provides visual feedback when touched.
 * Especially useful for mobile devices to improve the user experience.
 */
const TouchFeedback = ({
  children,
  className = '',
  activeClassName = 'bg-gray-100 dark:bg-gray-700',
  disabled = false,
  onClick = null,
  ...props
}) => {
  const [isActive, setIsActive] = useState(false);

  const handleTouchStart = () => {
    if (!disabled) {
      setIsActive(true);
    }
  };

  const handleTouchEnd = () => {
    if (!disabled) {
      setIsActive(false);
    }
  };

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <div
      className={`${className} ${isActive ? activeClassName : ''} touch-manipulation`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
};

export default TouchFeedback;
