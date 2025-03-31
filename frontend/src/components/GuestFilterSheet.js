import React from 'react';
import haptic from '../utils/haptic';

const GuestFilterSheet = ({ setFilter, filter, setSortField, sortField, setSortOrder, sortOrder }) => {
  const handleFilterChange = (newFilter) => {
    haptic.lightFeedback();
    setFilter(newFilter);
  };
  
  const handleSortFieldChange = (e) => {
    haptic.lightFeedback();
    setSortField(e.target.value);
  };
  
  const handleSortOrderChange = (e) => {
    haptic.lightFeedback();
    setSortOrder(e.target.value);
  };
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">Filter Guests</h3>
      
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Show:</p>
        <div className="space-y-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`w-full px-4 py-3 rounded-lg text-left ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              All Guests
            </div>
          </button>
          
          <button
            onClick={() => handleFilterChange('invited')}
            className={`w-full px-4 py-3 rounded-lg text-left ${
              filter === 'invited' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Invited
            </div>
          </button>
          
          <button
            onClick={() => handleFilterChange('notInvited')}
            className={`w-full px-4 py-3 rounded-lg text-left ${
              filter === 'notInvited' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Not Invited
            </div>
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by:</p>
        <select 
          value={sortField} 
          onChange={handleSortFieldChange}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="name">Name</option>
          <option value="contact">Contact</option>
          <option value="invited">Invitation Status</option>
        </select>
      </div>
      
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order:</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSortOrder('asc')}
            className={`px-4 py-3 rounded-lg text-center ${
              sortOrder === 'asc' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            Ascending
          </button>
          
          <button
            onClick={() => setSortOrder('desc')}
            className={`px-4 py-3 rounded-lg text-center ${
              sortOrder === 'desc' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            Descending
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestFilterSheet;
