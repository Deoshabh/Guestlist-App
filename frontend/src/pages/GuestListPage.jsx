import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuests } from '../contexts/GuestsContext';
import { useGuestGroups } from '../contexts/GuestGroupsContext';
import GuestList from '../components/GuestList';
import SearchBox from '../components/SearchBox';
import GroupFilter from '../components/GroupFilter';
import FloatingActionButton from '../components/FloatingActionButton';
import GuestDetailModal from '../components/GuestDetailModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastManager';
import WhatsAppMessageComposer from '../components/WhatsAppMessageComposer';
import haptic from '../utils/haptic';

const GuestListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  
  const { guests, loading, error, fetchGuests, deleteGuest } = useGuests();
  const { groups, fetchGroups } = useGuestGroups();
  const navigate = useNavigate();
  const toast = useToast();

  // Fetch guests and groups on mount
  useEffect(() => {
    fetchGuests();
    fetchGroups();
  }, [fetchGuests, fetchGroups]);

  // Filter guests based on search term and selected group
  useEffect(() => {
    if (!guests) return;
    
    let filtered = [...guests];
    
    // Filter by group
    if (selectedGroupId) {
      filtered = filtered.filter(guest => guest.groupId === selectedGroupId);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(guest => 
        guest.name.toLowerCase().includes(term) || 
        guest.email?.toLowerCase().includes(term) || 
        guest.phone?.includes(term) ||
        guest.notes?.toLowerCase().includes(term)
      );
    }
    
    setFilteredGuests(filtered);
  }, [guests, searchTerm, selectedGroupId]);

  const handleShowDetail = (guest) => {
    setSelectedGuest(guest);
    setShowDetailModal(true);
    haptic.lightFeedback();
  };

  const handleEdit = (guest) => {
    navigate(`/guests/edit/${guest._id}`);
    setShowDetailModal(false);
  };

  const handleConfirmDelete = (guestId) => {
    setShowDetailModal(false);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteGuest(selectedGuest._id);
      toast.success('Guest deleted successfully');
      haptic.successFeedback();
    } catch (error) {
      toast.error('Failed to delete guest');
      haptic.errorFeedback();
    } finally {
      setShowDeleteConfirm(false);
      setSelectedGuest(null);
    }
  };

  const handleAddGuest = () => {
    navigate('/guests/add');
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedGuests([]);
    haptic.lightFeedback();
  };

  const handleSelectGuest = (guest) => {
    if (selectMode) {
      setSelectedGuests(prev => {
        const isSelected = prev.some(g => g._id === guest._id);
        haptic.lightFeedback();
        if (isSelected) {
          return prev.filter(g => g._id !== guest._id);
        } else {
          return [...prev, guest];
        }
      });
    } else {
      handleShowDetail(guest);
    }
  };

  const handleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests([...filteredGuests]);
    }
    haptic.mediumFeedback();
  };

  const handleBulkMessage = () => {
    if (selectedGuests.length === 0) {
      toast.warning('Please select at least one guest');
      haptic.warningFeedback();
      return;
    }
    
    setShowBulkMessageModal(true);
    haptic.mediumFeedback();
  };

  const selectedGroup = selectedGroupId ? groups.find(g => g._id === selectedGroupId) : null;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">Guests</h1>
        
        <div className="flex flex-wrap gap-2">
          {selectMode ? (
            <>
              <button 
                onClick={handleSelectAll}
                className="btn btn-outline btn-sm"
              >
                {selectedGuests.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
              </button>
              <button 
                onClick={handleBulkMessage}
                className="btn btn-success btn-sm"
                disabled={selectedGuests.length === 0}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Send Messages
                </div>
              </button>
              <button 
                onClick={toggleSelectMode}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleSelectMode}
                className="btn btn-outline btn-sm"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Select Multiple
                </div>
              </button>
              <button 
                onClick={handleAddGuest}
                className="btn btn-primary btn-sm"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add Guest
                </div>
              </button>
            </>
          )}
        </div>
      </div>
      
      {showBulkMessageModal ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Send Messages to {selectedGuests.length} Guests
            </h2>
            <button 
              onClick={() => setShowBulkMessageModal(false)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Back to Guest List
            </button>
          </div>
          <WhatsAppMessageComposer 
            guests={selectedGuests}
            selectedGroup={selectedGroup}
            guestGroups={groups}
            isMobile={window.innerWidth < 768}
            onEditGuest={(guest) => {
              setShowBulkMessageModal(false);
              handleEdit(guest);
            }}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SearchBox 
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search guests..."
            />
            
            <GroupFilter 
              groups={groups}
              selectedGroupId={selectedGroupId}
              onChange={setSelectedGroupId}
            />
            
            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''} 
                {selectedGroupId ? ` in ${groups.find(g => g._id === selectedGroupId)?.name}` : ''}
              </p>
            </div>
          </div>
          
          <GuestList
            guests={filteredGuests}
            loading={loading}
            error={error}
            onSelect={handleSelectGuest}
            showCheckboxes={selectMode}
            selectedGuests={selectedGuests}
          />
        </>
      )}
      
      {/* Guest Detail Modal */}
      {showDetailModal && selectedGuest && (
        <GuestDetailModal
          guest={selectedGuest}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedGuest(null);
          }}
          onEdit={handleEdit}
          onDelete={handleConfirmDelete}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedGuest && (
        <ConfirmModal
          title="Delete Guest"
          message={`Are you sure you want to delete ${selectedGuest.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDestructive={true}
        />
      )}
      
      {/* Floating Action Button */}
      {!showBulkMessageModal && (
        <FloatingActionButton 
          onClick={handleAddGuest}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        />
      )}
    </div>
  );
};

export default GuestListPage;
