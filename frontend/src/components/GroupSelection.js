import React from 'react';
import haptic from '../utils/haptic';

const GroupSelection = ({ 
  groups = [], 
  selectedGroup, 
  onSelectGroup,
  className = '' 
}) => {
  // Handle group selection with haptic feedback
  const handleSelectGroup = (group) => {
    haptic.lightFeedback();
    onSelectGroup(group);
  };

  // Select all groups (null selection)
  const handleSelectAll = () => {
    haptic.lightFeedback();
    onSelectGroup(null);
  };

  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <div className={`group-selection mb-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        Filter by Group
      </h3>
      
      <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            className={`flex items-center whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
              !selectedGroup
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            All Groups
          </button>
          
          {groups.map(group => (
            <button
              key={group._id}
              onClick={() => handleSelectGroup(group)}
              className={`flex items-center whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
                selectedGroup && selectedGroup._id === group._id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate max-w-[150px]">{group.name}</span>
              {group._pendingSync && (
                <span className="ml-1 w-2 h-2 bg-yellow-400 rounded-full" title="Pending sync"></span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupSelection;
