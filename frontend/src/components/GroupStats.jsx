import React, { useMemo } from 'react';

const GroupStats = ({ guests = [], selectedGroup = null }) => {
  // Calculate stats for the current group
  const stats = useMemo(() => {
    if (!guests || guests.length === 0) {
      return {
        totalGuests: 0,
        invitedGuests: 0,
        invitationRate: 0,
        guestsWithPhone: 0,
        phoneRate: 0
      };
    }
    
    // Filter guests by selected group if necessary
    const filteredGuests = selectedGroup
      ? guests.filter(g => g.groupId === selectedGroup._id)
      : guests;
    
    const total = filteredGuests.length;
    const invited = filteredGuests.filter(g => g.invited).length;
    const withPhone = filteredGuests.filter(g => g.phone && g.phone.trim() !== '').length;
    
    return {
      totalGuests: total,
      invitedGuests: invited,
      invitationRate: total ? Math.round((invited / total) * 100) : 0,
      guestsWithPhone: withPhone,
      phoneRate: total ? Math.round((withPhone / total) * 100) : 0
    };
  }, [guests, selectedGroup]);

  return (
    <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-medium mb-3 dark:text-white flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {selectedGroup ? `${selectedGroup.name} Statistics` : 'Overall Statistics'}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {stats.totalGuests}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Total Guests
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {stats.invitedGuests}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Invited
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {stats.invitationRate}%
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            Invitation Rate
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {stats.guestsWithPhone}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            With Phone ({stats.phoneRate}%)
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Invitation Progress</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {stats.invitedGuests}/{stats.totalGuests}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
          <div 
            className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full" 
            style={{ width: `${stats.invitationRate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GroupStats;
