import React, { useMemo } from 'react';

const GroupStats = ({ guests, selectedGroup }) => {
  // Calculate stats for the current group
  const stats = useMemo(() => {
    // Filter guests by group if a group is selected
    const groupGuests = selectedGroup 
      ? guests.filter(g => g.groupId === selectedGroup._id && !g.deleted)
      : guests.filter(g => !g.deleted);
    
    const total = groupGuests.length;
    const invited = groupGuests.filter(g => g.invited).length;
    const pending = total - invited;
    
    // Calculate percentage for progress bar
    const invitedPercent = total > 0 ? Math.round((invited / total) * 100) : 0;
    
    return { total, invited, pending, invitedPercent };
  }, [guests, selectedGroup]);

  if (!guests || guests.length === 0) {
    return null;
  }

  return (
    <div className="group-stats rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm mb-4">
      <div className="flex justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {selectedGroup ? `${selectedGroup.name} Stats` : 'All Groups Stats'}
        </h3>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {stats.invitedPercent}% Invited
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-3">
        <div 
          className="bg-primary h-2.5 rounded-full" 
          style={{ width: `${stats.invitedPercent}%` }}
        ></div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-medium text-green-500 dark:text-green-400">Invited</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.invited}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-medium text-orange-500 dark:text-orange-400">Pending</p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
        </div>
      </div>
    </div>
  );
};

export default GroupStats;
