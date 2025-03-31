import React from 'react';
import haptic from '../utils/haptic';

/**
 * SearchFilterBar Component
 * Provides a simplified search and basic filter options
 */
const SearchFilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  invitedFilter, 
  onInvitedFilterChange,
  stats
}) => {
  const handleFilterChange = (filterValue) => {
    haptic.lightFeedback();
    onInvitedFilterChange(filterValue);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      {/* Search input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search guests..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
        />
        <svg
          className="absolute left-3 top-2.5 text-gray-400 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      {/* Quick filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => handleFilterChange('all')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            invitedFilter === 'all' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          All ({stats.total || 0})
        </button>
        
        <button
          onClick={() => handleFilterChange('invited')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            invitedFilter === 'invited' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Invited ({stats.invited || 0})
        </button>
        
        <button
          onClick={() => handleFilterChange('notInvited')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            invitedFilter === 'notInvited' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Pending ({stats.pending || 0})
        </button>
      </div>
    </div>
  );
};

export default SearchFilterBar;
