import React, { useState, useEffect } from 'react';
import axios from 'axios';
import haptic from '../utils/haptic';
import { useToast } from './ToastManager';
import db from '../utils/db';
import GroupStats from './GroupStats';
import useErrorHandler from '../hooks/useErrorHandler';
import ErrorBoundary from './ErrorBoundary';

const GuestListManager = ({ 
  token, 
  apiBaseUrl = '/api', 
  isOnline = true,
  selectedGroup,
  setSelectedGroup,
  guests = [] // Add guests prop
}) => {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { 
    errors, 
    handleError, 
    clearError, 
    retryOperation, 
    withConnectivityCheck 
  } = useErrorHandler();

  // Fetch guest groups on component mount
  useEffect(() => {
    fetchGroups();
  }, [token]);

  const fetchGroups = async () => {
    clearError('fetchGroups');
    setLoading(true);
    
    try {
      if (!isOnline) {
        const storedGroups = await db.getGroups();
        if (storedGroups && storedGroups.length > 0) {
          setGroups(storedGroups);
          
          // Set default selected group if none is selected
          if (!selectedGroup && storedGroups.length > 0) {
            setSelectedGroup(storedGroups[0]);
          }
          
          setLoading(false);
          return;
        }
        
        // If we can't get stored groups while offline, show a helpful message
        throw new Error('Could not load groups while offline. Please reconnect to the internet.');
      }
      
      // Fetch from API if online
      const response = await axios.get(`${apiBaseUrl}/guest-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedGroups = response.data;
      setGroups(fetchedGroups);
      
      // Save to IndexedDB for offline use
      await db.saveGroups(fetchedGroups);
      
      // Set default selected group if none is selected
      if (!selectedGroup && fetchedGroups.length > 0) {
        setSelectedGroup(fetchedGroups[0]);
      }
      
    } catch (error) {
      handleError(error, 'fetchGroups', {
        defaultMessage: 'Failed to load guest groups',
        context: 'Loading groups'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!newGroupName.trim()) {
      handleError('Please enter a group name', 'createGroup');
      return;
    }
    
    try {
      setLoading(true);
      
      if (isOnline) {
        const result = await withConnectivityCheck(async () => {
          const response = await axios.post(
            `${apiBaseUrl}/guest-groups`, 
            { name: newGroupName.trim() },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const newGroup = response.data;
          setGroups([...groups, newGroup]);
          setNewGroupName('');
          
          // Save to IndexedDB
          await db.saveGroup(newGroup);
          
          haptic.mediumFeedback();
          toast.success(`Created group "${newGroup.name}"`);
          
          // Select the new group
          setSelectedGroup(newGroup);
          
          return newGroup;
        }, {
          offlineFallback: async () => {
            // Create a temporary group with pending sync for offline mode
            const tempGroup = {
              _id: `temp_${Date.now()}`,
              name: newGroupName.trim(),
              _pendingSync: true,
              createdAt: new Date().toISOString()
            };
            
            // Save to local DB
            await db.saveGroup(tempGroup);
            
            // Add to the UI
            setGroups([...groups, tempGroup]);
            setNewGroupName('');
            setSelectedGroup(tempGroup);
            
            // Save to local queue for later sync
            await db.queueAction('CREATE_GROUP', { name: newGroupName.trim() });
            
            haptic.mediumFeedback();
            toast.success(`Created group "${tempGroup.name}" (offline)`);
            
            return tempGroup;
          }
        });
        
        if (result && onGroupSelect) {
          onGroupSelect(result);
        }
      } else {
        // Offline mode - similar to offlineFallback above
        const tempGroup = {
          _id: `temp_${Date.now()}`,
          name: newGroupName.trim(),
          _pendingSync: true,
          createdAt: new Date().toISOString()
        };
        
        // Save to local DB
        await db.saveGroup(tempGroup);
        
        // Add to the UI
        setGroups([...groups, tempGroup]);
        setNewGroupName('');
        setSelectedGroup(tempGroup);
        
        // Save to local queue for later sync
        await db.queueAction('CREATE_GROUP', { name: newGroupName.trim() });
        
        haptic.mediumFeedback();
        toast.success(`Created group "${tempGroup.name}" (offline)`);
        
        if (onGroupSelect) {
          onGroupSelect(tempGroup);
        }
      }
    } catch (error) {
      handleError(error, 'createGroup', {
        defaultMessage: 'Failed to create guest group'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = (group) => {
    setIsEditing(true);
    setEditingGroup(group);
    setNewGroupName(group.name);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    
    if (!newGroupName.trim() || !editingGroup) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (isOnline) {
        const response = await axios.put(
          `${apiBaseUrl}/guest-groups/${editingGroup._id}`,
          { name: newGroupName.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const updatedGroup = response.data;
        
        // Update groups list
        setGroups(groups.map(g => 
          g._id === updatedGroup._id ? updatedGroup : g
        ));
        
        // Save to IndexedDB
        await db.saveGroup(updatedGroup);
        
        // Update selected group if it was being edited
        if (selectedGroup && selectedGroup._id === updatedGroup._id) {
          setSelectedGroup(updatedGroup);
        }
        
        // Reset form
        setNewGroupName('');
        setIsEditing(false);
        setEditingGroup(null);
        
        haptic.mediumFeedback();
        toast.success(`Updated group "${updatedGroup.name}"`);
      } else {
        // Offline update
        const updatedGroup = {
          ...editingGroup,
          name: newGroupName.trim(),
          _pendingSync: true
        };
        
        // Save to local DB
        await db.saveGroup(updatedGroup);
        
        // Update groups list
        setGroups(groups.map(g => 
          g._id === editingGroup._id ? updatedGroup : g
        ));
        
        // Update selected group if it was being edited
        if (selectedGroup && selectedGroup._id === updatedGroup._id) {
          setSelectedGroup(updatedGroup);
        }
        
        // Queue for later sync
        await db.queueAction('UPDATE_GROUP', {
          id: editingGroup._id,
          data: { name: newGroupName.trim() }
        });
        
        // Reset form
        setNewGroupName('');
        setIsEditing(false);
        setEditingGroup(null);
        
        haptic.mediumFeedback();
        toast.success(`Updated group "${updatedGroup.name}" (offline)`);
      }
    } catch (error) {
      console.error('Error updating guest group:', error);
      toast.error('Failed to update guest group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? All guests in this group will be moved to the default group.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (isOnline) {
        await axios.delete(
          `${apiBaseUrl}/guest-groups/${groupId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Remove from IndexedDB
        await db.deleteGroup(groupId);
        
        // Remove from groups list
        const updatedGroups = groups.filter(g => g._id !== groupId);
        setGroups(updatedGroups);
        
        // If the deleted group was selected, select the first available group
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(updatedGroups.length > 0 ? updatedGroups[0] : null);
        }
        
        haptic.mediumFeedback();
        toast.success('Group deleted successfully');
      } else {
        // Offline delete
        // Remove from groups list UI
        const updatedGroups = groups.filter(g => g._id !== groupId);
        setGroups(updatedGroups);
        
        // If the deleted group was selected, select the first available group
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(updatedGroups.length > 0 ? updatedGroups[0] : null);
        }
        
        // Queue for later sync
        await db.queueAction('DELETE_GROUP', { id: groupId });
        
        // Remove from IndexedDB
        await db.deleteGroup(groupId);
        
        haptic.mediumFeedback();
        toast.success('Group deleted successfully (offline)');
      }
    } catch (error) {
      console.error('Error deleting guest group:', error);
      toast.error('Failed to delete guest group');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = (group) => {
    haptic.lightFeedback();
    setSelectedGroup(group);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingGroup(null);
    setNewGroupName('');
    clearError('updateGroup');
  };

  return (
    <ErrorBoundary onReset={fetchGroups}>
      <div className="guest-groups mb-6 animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Guest Groups
        </h2>
        
        {/* Group form */}
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <form onSubmit={isEditing ? handleUpdateGroup : handleCreateGroup} className="space-y-3">
            <div className="flex flex-col">
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isEditing ? (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Update Group Name
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Group
                  </span>
                )}
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-grow">
                  <input
                    id="groupName"
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder={isEditing ? "Update group name" : "Enter group name"}
                    className="input w-full pl-10"
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !newGroupName.trim()}
                  className="btn btn-primary touch-manipulation flex-shrink-0 px-4"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isEditing ? (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create
                    </span>
                  )}
                </button>
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn btn-outline touch-manipulation flex-shrink-0"
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Show specific error for this operation */}
            {errors.fetchGroups && (
              <div className="p-3 mb-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200 animate-fadeIn">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errors.fetchGroups.message}</span>
                </div>
                <div className="mt-2 ml-7">
                  <button 
                    onClick={() => retryOperation(fetchGroups, 'fetchGroups')}
                    className="text-red-700 dark:text-red-300 underline font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            
            {errors.createGroup && (
              <div className="p-3 mb-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200 animate-fadeIn">
                {errors.createGroup.message}
              </div>
            )}
          </form>
        </div>
        
        {/* Selected group indicator */}
        {selectedGroup && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900 p-3 rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-blue-700 dark:text-blue-200 font-medium">
              Current selection: <span className="font-bold">{selectedGroup.name}</span>
            </span>
          </div>
        )}
        
        {/* Add GroupStats component before or after the groups list */}
        <GroupStats 
          guests={guests} 
          selectedGroup={selectedGroup} 
        />
        
        {/* Groups list */}
        <div className="flex overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex space-x-2">
            <button
              onClick={() => handleSelectGroup(null)}
              className={`flex items-center whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors touch-manipulation ${
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
                className={`flex items-center whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors touch-manipulation ${
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
        
        {/* Group management */}
        {groups.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-medium mb-3 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Groups
            </h3>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {groups.map(group => (
                <div key={group._id} className="py-3 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-700 px-2 rounded-md transition-colors">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{group.name}</span>
                    {group._pendingSync && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full">
                        Pending Sync
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full dark:text-blue-400 dark:hover:bg-blue-900 touch-manipulation"
                      aria-label={`Edit ${group.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group._id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full dark:text-red-400 dark:hover:bg-red-900 touch-manipulation"
                      aria-label={`Delete ${group.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default GuestListManager;
