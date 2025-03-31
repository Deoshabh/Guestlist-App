import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuestGroups } from '../contexts/GuestGroupsContext';
import { useToast } from './ToastManager';
import GroupCard from './GroupCard';
import CreateGroupModal from './CreateGroupModal';
import GroupDetailModal from './GroupDetailModal';
import GuestList from './GuestList';
import WhatsAppMessageComposer from './WhatsAppMessageComposer';
import haptic from '../utils/haptic';

const GuestGroupsPage = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [showWhatsAppComposer, setShowWhatsAppComposer] = useState(false);
  const [groupGuests, setGroupGuests] = useState([]);
  const [editingGuest, setEditingGuest] = useState(null);
  
  const { groups, loading, error, fetchGroups, deleteGroup } = useGuestGroups();
  const toast = useToast();
  const navigate = useNavigate();

  // Filter groups based on search term
  useEffect(() => {
    if (!groups) return;
    
    if (!searchTerm.trim()) {
      setFilteredGroups(groups);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = groups.filter(group => 
        group.name.toLowerCase().includes(term) || 
        group.description?.toLowerCase().includes(term)
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, groups]);

  // Fetch groups on component mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
    haptic.lightFeedback();
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroup(groupId);
      toast.success('Group deleted successfully');
      haptic.successFeedback();
      setShowDetailModal(false);
      setSelectedGroup(null);
    } catch (error) {
      toast.error('Failed to delete group');
      haptic.errorFeedback();
      console.error('Error deleting group:', error);
    }
  };

  const handleCreateGroup = () => {
    setShowCreateModal(true);
    haptic.lightFeedback();
  };

  const handleOpenWhatsAppComposer = (group, guests) => {
    setSelectedGroup(group);
    setGroupGuests(guests);
    setShowWhatsAppComposer(true);
    setShowDetailModal(false);
    haptic.mediumFeedback();
  };

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setShowWhatsAppComposer(false);
    navigate(`/guests/edit/${guest._id}`, { state: { returnTo: '/groups' } });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Guest Groups</h1>
        <button 
          onClick={handleCreateGroup}
          className="btn btn-primary"
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Group
          </div>
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search groups..."
          className="input w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* WhatsApp Message Composer */}
      {showWhatsAppComposer && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Messaging {selectedGroup.name}
            </h2>
            <button 
              onClick={() => setShowWhatsAppComposer(false)} 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Back to Groups
            </button>
          </div>
          <WhatsAppMessageComposer 
            guests={groupGuests} 
            selectedGroup={selectedGroup}
            guestGroups={groups}
            isMobile={window.innerWidth < 768}
            onEditGuest={handleEditGuest}
          />
        </div>
      )}

      {/* Group Cards */}
      {!showWhatsAppComposer && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="spinner"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading groups...</p>
            </div>
          ) : error ? (
            <div className="col-span-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded">
              <p>Error loading groups. Please try again.</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No groups match your search' : 'No groups yet. Create your first group!'}
              </p>
            </div>
          ) : (
            filteredGroups.map(group => (
              <GroupCard 
                key={group._id} 
                group={group} 
                onSelect={() => handleSelectGroup(group)}
              />
            ))
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            fetchGroups();
          }}
        />
      )}

      {/* Group Detail Modal */}
      {showDetailModal && selectedGroup && (
        <GroupDetailModal 
          group={selectedGroup}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedGroup(null);
          }}
          onDelete={() => handleDeleteGroup(selectedGroup._id)}
          onEdit={(updatedGroup) => {
            setSelectedGroup(updatedGroup);
            fetchGroups();
          }}
          onSendMessages={(guests) => handleOpenWhatsAppComposer(selectedGroup, guests)}
        />
      )}
    </div>
  );
};

export default GuestGroupsPage;
