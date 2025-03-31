import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../BottomSheet';
import haptic from '../../utils/haptic';

/**
 * ActionMenu Component
 * A mobile-friendly menu that houses secondary actions and options
 */
const ActionMenu = ({ 
  isOpen, 
  onClose, 
  onExportCSV, 
  onImportCSV, 
  onManageGroups,
  isOnline,
  onToggleView
}) => {
  const navigate = useNavigate();

  const handleAction = (callback) => {
    haptic.mediumFeedback();
    onClose();
    if (callback) callback();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      height="60vh"
      title="Guest Management Options"
    >
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Add Guest */}
          <button
            onClick={() => handleAction(() => navigate('/guests/add'))}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Add Guest</span>
          </button>
          
          {/* Import Contacts */}
          <button
            onClick={() => handleAction(() => navigate('/contacts/import'))}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Import Contacts</span>
          </button>
          
          {/* Manage Groups */}
          <button
            onClick={() => handleAction(onManageGroups)}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Manage Groups</span>
          </button>
          
          {/* Toggle View */}
          <button
            onClick={() => handleAction(onToggleView)}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Toggle View</span>
          </button>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6">Data Management</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Export CSV */}
          <button
            onClick={() => handleAction(onExportCSV)}
            disabled={!isOnline}
            className={`flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Export CSV</span>
          </button>
          
          {/* Import CSV */}
          <button
            onClick={() => handleAction(onImportCSV)}
            disabled={!isOnline}
            className={`flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500 dark:text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Import CSV</span>
          </button>
        </div>

        {!isOnline && (
          <div className="p-3 mt-4 text-sm text-orange-700 bg-orange-100 rounded-lg dark:bg-orange-900 dark:text-orange-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Some features are limited in offline mode</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default ActionMenu;
