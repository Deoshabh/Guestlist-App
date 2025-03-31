import React from 'react';

/**
 * GuestSummaryCard Component
 * Displays a simplified summary of guest stats
 */
const GuestSummaryCard = ({ stats }) => {
  // Default stats if not provided
  const defaultStats = {
    total: 0,
    invited: 0,
    pending: 0,
    percentage: 0
  };
  
  const { total, invited, pending, percentage } = { ...defaultStats, ...stats };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800 dark:text-white text-lg">Guest Summary</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{invited}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Invited</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pending}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-300">Invitation Progress</span>
          <span className="font-medium text-gray-800 dark:text-white">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GuestSummaryCard;
