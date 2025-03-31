import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuests } from '../contexts/GuestContext';
import { useGuestGroups } from '../contexts/GuestGroupContext';
import { useNetwork } from '../contexts/NetworkContext';
import { useToast } from '../components/ToastManager';
import haptic from '../utils/haptic';

// Import our new components
import BottomNavigationBar from '../components/navigation/BottomNavigationBar';
import ActionMenu from '../components/menus/ActionMenu';
import GuestSummaryCard from '../components/GuestSummaryCard';
import SearchFilterBar from '../components/SearchFilterBar';

// Import existing components
import GuestList from '../components/GuestList';
import GuestDetailModal from '../components/GuestDetailModal';
import ConfirmModal from '../components/ConfirmModal';
import WhatsAppMessageComposer from '../components/WhatsAppMessageComposer';
import GuestListManager from '../components/GuestListManager';
import LoadingIndicator from '../components/LoadingIndicator';
import axios from 'axios';

const GuestListPage = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [invitedFilter, setInvitedFilter] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  
  // Import hooks and contexts
  const { guests, loading, error, fetchGuests, deleteGuest } = useGuests();
  const { groups, fetchGroups } = useGuestGroups();
  const { isOnline, API_BASE_URL } = useNetwork();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const csvFileInputRef = useRef(null);

  // Fetch guests and groups on mount
  useEffect(() => {
    fetchGuests();
    fetchGroups();
  }, [fetchGuests, fetchGroups]);

  // Filter guests based on search term, invited filter, and selected group
  useEffect(() => {
    if (!guests) return;
    
    let filtered = [...guests];
    
    // Filter by group
    if (selectedGroupId) {
      filtered = filtered.filter(guest => guest.groupId === selectedGroupId);
    }
    
    // Filter by invitation status
    if (invitedFilter === 'invited') {
      filtered = filtered.filter(guest => guest.invited);
    } else if (invitedFilter === 'notInvited') {
      filtered = filtered.filter(guest => !guest.invited);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(guest => 
        guest.name?.toLowerCase().includes(term) || 
        guest.email?.toLowerCase().includes(term) || 
        guest.phone?.includes(term) ||
        guest.notes?.toLowerCase().includes(term)
      );
    }
    
    setFilteredGuests(filtered);
  }, [guests, searchTerm, invitedFilter, selectedGroupId]);

  // Calculate stats for the GuestSummaryCard
  const guestStats = {
    total: guests?.length || 0,
    invited: guests?.filter(g => g.invited).length || 0,
    pending: guests?.filter(g => !g.invited).length || 0,
    percentage: guests?.length > 0 
      ? Math.round((guests.filter(g => g.invited).length / guests.length) * 100) 
      : 0
  };

  // Event handlers
  const handleShowDetail = (guest) => {
    setSelectedGuest(guest);
    setShowDetailModal(true);
    haptic.lightFeedback();
  };

  const handleEdit = (guest) => {
    navigate(`/guests/edit/${guest._id}`);
    setShowDetailModal(false);
  };

  const handleConfirmDelete = () => {
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

  const handleToggleView = () => {
    setViewMode(prev => prev === 'card' ? 'table' : 'card');
    haptic.lightFeedback();
  };

  const handleExportCSV = async () => {
    if (!isOnline) {
      toast.warning('Export is only available online');
      haptic.warningFeedback();
      return;
    }
    
    try {
      // Make a direct request to download the file
      const response = await axios.get(`${API_BASE_URL}/guests/export`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        responseType: 'blob'
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'guests.csv');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      haptic.mediumFeedback();
      toast.success('Guests exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export guests. Please try again.');
      haptic.errorFeedback();
    }
  };

  const handleImportCSV = () => {
    if (!isOnline) {
      toast.warning('Import is only available online');
      haptic.warningFeedback();
      return;
    }
    
    if (csvFileInputRef.current) {
      csvFileInputRef.current.click();
    }
  };

  const processImportedFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post(`${API_BASE_URL}/guests/import`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
      });
      fetchGuests();
      haptic.successFeedback();
      toast.success('Guests imported successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error importing guests');
      haptic.errorFeedback();
    } finally {
      e.target.value = null;
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 pb-24">
        {/* Simple header with title and select mode toggle */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {selectedGroup ? selectedGroup.name : 'All Guests'}
          </h1>
          
          {selectMode ? (
            <div className="flex gap-2">
              <button 
                onClick={handleSelectAll}
                className="btn btn-outline btn-sm"
              >
                {selectedGuests.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
              </button>
              <button 
                onClick={handleBulkMessage}
                className="btn btn-primary btn-sm"
                disabled={selectedGuests.length === 0}
              >
                Message
              </button>
              <button 
                onClick={toggleSelectMode}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={toggleSelectMode}
              className="btn btn-outline btn-sm"
            >
              Select
            </button>
          )}
        </div>
        
        {/* Loading state */}
        {loading ? (
          <LoadingIndicator />
        ) : (
          <>
            {/* Show WhatsApp message composer when in bulk message mode */}
            {showBulkMessageModal ? (
              <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Send Messages ({selectedGuests.length})
                  </h2>
                  <button 
                    onClick={() => setShowBulkMessageModal(false)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Back to List
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
              <div className="space-y-4 animate-fadeIn">
                {/* Summary Card - Quick stats at a glance */}
                <GuestSummaryCard stats={guestStats} />
                
                {/* Search and Filter Bar - Simplified filtering */}
                <SearchFilterBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  invitedFilter={invitedFilter}
                  onInvitedFilterChange={setInvitedFilter}
                  stats={guestStats}
                />
                
                {/* Simple notification when no guests match */}
                {filteredGuests.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">No guests match your criteria</p>
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setInvitedFilter('all');
                        setSelectedGroupId(null);
                      }} 
                      className="text-primary hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  /* Guest List - Minimalist version */
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''}
                    </div>
                    <GuestList
                      guests={filteredGuests}
                      onSelect={handleSelectGuest}
                      showCheckboxes={selectMode}
                      selectedGuests={selectedGuests}
                      viewMode={viewMode}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
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
      
      {/* Group Manager Modal */}
      {showGroupManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Manage Groups</h2>
              <button 
                onClick={() => setShowGroupManager(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <GuestListManager
                selectedGroup={selectedGroup}
                setSelectedGroup={group => {
                  setSelectedGroupId(group?._id || null);
                  setShowGroupManager(false);
                }}
                guests={guests}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input for CSV import */}
      <input 
        type="file" 
        ref={csvFileInputRef} 
        onChange={processImportedFile} 
        accept=".csv" 
        className="hidden" 
      />
      
      {/* Action Menu for Secondary Options */}
      <ActionMenu
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        onManageGroups={() => setShowGroupManager(true)}
        isOnline={isOnline}
        onToggleView={handleToggleView}
      />
      
      {/* Bottom Navigation Bar */}
      <BottomNavigationBar
        onOpenActionMenu={() => setShowActionMenu(true)}
      />
    </div>
  );
};

export default GuestListPage;
