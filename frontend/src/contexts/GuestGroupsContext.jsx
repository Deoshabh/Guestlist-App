import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../components/ToastManager';
import haptic from '../utils/haptic';
import db from '../utils/db';
import { useNetwork } from './NetworkContext';

// Create context
const GuestGroupsContext = createContext();

export const GuestGroupsProvider = ({ children, apiBaseUrl = '/api' }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const { isOnline } = useNetwork();

  // Fetch all groups
  const fetchGroups = useCallback(async (token) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (!isOnline) {
        // If offline, try to get from IndexedDB
        const storedGroups = await db.getGroups();
        if (storedGroups && storedGroups.length > 0) {
          setGroups(storedGroups);
          setLoading(false);
          return;
        }
        throw new Error('Cannot fetch groups while offline');
      }
      
      const response = await axios.get(`${apiBaseUrl}/guest-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedGroups = response.data;
      setGroups(fetchedGroups);
      
      // Save to IndexedDB for offline use
      await db.saveGroups(fetchedGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err.response?.data?.error || 'Failed to fetch groups');
      
      // Try to load from IndexedDB as fallback
      try {
        const storedGroups = await db.getGroups();
        if (storedGroups && storedGroups.length > 0) {
          setGroups(storedGroups);
          toast.info('Showing cached groups while offline');
        }
      } catch (dbErr) {
        console.error('Error fetching from local storage:', dbErr);
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, apiBaseUrl, toast]);

  // Create a new group
  const createGroup = useCallback(async (token, groupData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isOnline) {
        // Create a temporary group with pending sync for offline mode
        const tempGroup = {
          _id: `temp_${Date.now()}`,
          name: groupData.name,
          _pendingSync: true,
          createdAt: new Date().toISOString()
        };
        
        // Save to local DB
        await db.saveGroup(tempGroup);
        
        // Add to the state
        setGroups(prev => [...prev, tempGroup]);
        
        // Queue for later sync
        await db.queueAction('CREATE_GROUP', { name: groupData.name });
        
        haptic.successFeedback();
        toast.success(`Created group "${tempGroup.name}" (offline)`);
        
        setLoading(false);
        return tempGroup;
      }
      
      // Online mode
      const response = await axios.post(
        `${apiBaseUrl}/guest-groups`,
        groupData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newGroup = response.data;
      
      // Update state
      setGroups(prev => [...prev, newGroup]);
      
      // Save to IndexedDB
      await db.saveGroup(newGroup);
      
      haptic.successFeedback();
      toast.success(`Created group "${newGroup.name}"`);
      
      return newGroup;
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.response?.data?.error || 'Failed to create group');
      haptic.errorFeedback();
      toast.error(err.response?.data?.error || 'Failed to create group');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isOnline, apiBaseUrl, toast]);

  // Update a group
  const updateGroup = useCallback(async (token, group) => {
    if (!group || !group._id) {
      toast.error('Invalid group data');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!isOnline) {
        // Offline update
        const updatedGroup = {
          ...group,
          _pendingSync: true
        };
        
        // Save to local DB
        await db.saveGroup(updatedGroup);
        
        // Update state
        setGroups(prev => prev.map(g => 
          g._id === updatedGroup._id ? updatedGroup : g
        ));
        
        // Queue for later sync
        await db.queueAction('UPDATE_GROUP', {
          id: updatedGroup._id,
          data: { name: updatedGroup.name }
        });
        
        haptic.successFeedback();
        toast.success(`Updated group "${updatedGroup.name}" (offline)`);
        
        setLoading(false);
        return updatedGroup;
      }
      
      // Online mode
      const response = await axios.put(
        `${apiBaseUrl}/guest-groups/${group._id}`,
        { name: group.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedGroup = response.data;
      
      // Update state
      setGroups(prev => prev.map(g => 
        g._id === updatedGroup._id ? updatedGroup : g
      ));
      
      // Save to IndexedDB
      await db.saveGroup(updatedGroup);
      
      haptic.successFeedback();
      toast.success(`Updated group "${updatedGroup.name}"`);
      
      return updatedGroup;
    } catch (err) {
      console.error('Error updating group:', err);
      setError(err.response?.data?.error || 'Failed to update group');
      haptic.errorFeedback();
      toast.error(err.response?.data?.error || 'Failed to update group');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isOnline, apiBaseUrl, toast]);

  // Delete a group
  const deleteGroup = useCallback(async (token, groupId) => {
    if (!groupId) {
      toast.error('Invalid group ID');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!isOnline) {
        // Remove from groups state
        setGroups(prev => prev.filter(g => g._id !== groupId));
        
        // Queue for later sync
        await db.queueAction('DELETE_GROUP', { id: groupId });
        
        // Remove from IndexedDB
        await db.deleteGroup(groupId);
        
        haptic.successFeedback();
        toast.success('Group deleted (offline)');
        
        setLoading(false);
        return true;
      }
      
      // Online mode
      await axios.delete(
        `${apiBaseUrl}/guest-groups/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove from state
      setGroups(prev => prev.filter(g => g._id !== groupId));
      
      // Remove from IndexedDB
      await db.deleteGroup(groupId);
      
      haptic.successFeedback();
      toast.success('Group deleted successfully');
      
      return true;
    } catch (err) {
      console.error('Error deleting group:', err);
      setError(err.response?.data?.error || 'Failed to delete group');
      haptic.errorFeedback();
      toast.error(err.response?.data?.error || 'Failed to delete group');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isOnline, apiBaseUrl, toast]);

  return (
    <GuestGroupsContext.Provider
      value={{
        groups,
        loading,
        error,
        fetchGroups,
        createGroup,
        updateGroup,
        deleteGroup
      }}
    >
      {children}
    </GuestGroupsContext.Provider>
  );
};

export const useGuestGroups = () => useContext(GuestGroupsContext);

export default GuestGroupsContext;
