import React from 'react';
import haptic from '../utils/haptic';

const BottomNavbar = ({ items, activeIdx, onItemClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
      <div className="grid grid-cols-5 h-14">
        {items.map((item, idx) => (
          <button
            key={idx}
            className={`flex flex-col items-center justify-center px-1 py-2 focus:outline-none ${
              idx === activeIdx
                ? 'text-primary dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => {
              haptic.lightFeedback();
              onItemClick(idx);
            }}
            aria-label={item.label}
            style={{ touchAction: 'manipulation' }}
          >
            <div className="w-6 h-6">{item.icon}</div>
            <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavbar;
