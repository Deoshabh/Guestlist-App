import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import EditGuestModal from './EditGuestModal';
import db from '../utils/db';
import haptic from '../utils/haptic';
import GuestListItem from './GuestListItem';
import BottomSheet from './BottomSheet';
import GuestFilterSheet from './GuestFilterSheet';
import VirtualList from './VirtualList';
import { useToast } from './ToastManager';
import useMediaQuery from '../utils/useMediaQuery';
import GroupMembershipManager from './GroupMembershipManager';

function GuestList({
  token,
  guests = [],
  onUpdate,
  apiBaseUrl = '/api',
  isOnline = true,
  selectedGroup = null,
  guestGroups = [],
}) {
  const safeGuests = Array.isArray(guests) ? guests : [];
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentGuest, setCurrentGuest] = useState(null);
  const [error, setError] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [page, setPage] = useState(1); // Added for pagination
  const itemsPerPage = 10;
  const toast = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const scrollContainerRef = useRef(null);

  // Preserve selections when guests update, only reset if filter/search changes
  useEffect(() => {
    setSelected((prev) => prev.filter((id) => safeGuests.some((g) => g._id === id)));
  }, [guests]);

  useEffect(() => {
    setSelected([]); // Reset on filter/search change
  }, [filter, search, selectedGroup]);

  const filteredByGroup = useMemo(() => {
    if (!selectedGroup) return safeGuests;
    return safeGuests.filter((guest) => guest.groupId === selectedGroup._id);
  }, [safeGuests, selectedGroup]);

  const filteredAndSortedGuests = useMemo(() => {
    let result = filteredByGroup;
    if (filter === 'invited') result = result.filter((g) => g.invited);
    else if (filter === 'notInvited') result = result.filter((g) => !g.invited);

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(searchLower) ||
          (g.contact && g.contact.toLowerCase().includes(searchLower))
      );
    }

    result.sort((a, b) => {
      const valueA = sortField === 'invited' ? (a.invited ? 1 : 0) : (a[sortField] || '').toLowerCase();
      const valueB = sortField === 'invited' ? (b.invited ? 1 : 0) : (b[sortField] || '').toLowerCase();
      return sortOrder === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
    });

    return result;
  }, [filteredByGroup, filter, search, sortField, sortOrder]);

  const paginatedGuests = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedGuests.slice(start, end);
  }, [filteredAndSortedGuests, page]);

  const totalPages = Math.ceil(filteredAndSortedGuests.length / itemsPerPage);
  const isAllSelected = paginatedGuests.every((g) => selected.includes(g._id));

  const toggleAll = () => {
    haptic.lightFeedback();
    setSelected(isAllSelected ? [] : paginatedGuests.map((g) => g._id));
  };

  const toggleSelect = (id) => {
    haptic.lightFeedback();
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const updateBulkInvited = async (invited) => {
    if (!selected.length) return;
    setLoading(true);
    setError('');
    try {
      if (isOnline) {
        await axios.put(
          `${apiBaseUrl}/guests/bulk-update`,
          { ids: selected, invited },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const updates = safeGuests.filter((g) => selected.includes(g._id)).map((g) => ({
          ...g,
          invited,
          _pendingSync: true,
        }));
        await Promise.all(updates.map((g) => db.saveGuest(g)));
        await db.queueAction('BULK_UPDATE_GUESTS', { ids: selected, data: { invited } });
      }
      setSelected([]);
      onUpdate();
      haptic.successFeedback();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update guests');
      haptic.errorFeedback();
    } finally {
      setLoading(false);
    }
  };

  const toggleGuestInvited = async (id, currentStatus) => {
    setLoading(true);
    setError('');
    try {
      const guest = safeGuests.find((g) => g._id === id);
      if (!guest) throw new Error('Guest not found');
      if (isOnline) {
        await axios.put(
          `${apiBaseUrl}/guests/${id}`,
          { invited: !currentStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const updatedGuest = { ...guest, invited: !currentStatus, _pendingSync: true };
        await db.saveGuest(updatedGuest);
        await db.queueAction('UPDATE_GUEST', { id, data: { invited: !currentStatus } });
      }
      onUpdate();
      haptic.successFeedback();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update guest');
      haptic.errorFeedback();
    } finally {
      setLoading(false);
    }
  };

  const deleteGuest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this guest?')) return;
    setLoading(true);
    setError('');
    try {
      const guest = safeGuests.find((g) => g._id === id);
      if (!guest) throw new Error('Guest not found');
      if (isOnline) {
        await axios.delete(`${apiBaseUrl}/guests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const updatedGuest = { ...guest, deleted: true, _pendingSync: true };
        await db.saveGuest(updatedGuest);
        await db.queueAction('DELETE_GUEST', { id });
      }
      onUpdate();
      haptic.successFeedback();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete guest');
      haptic.errorFeedback();
    } finally {
      setLoading(false);
    }
  };

  const undoDelete = async (id) => {
    setLoading(true);
    setError('');
    try {
      const guest = safeGuests.find((g) => g._id === id);
      if (!guest) throw new Error('Guest not found');
      if (isOnline) {
        await axios.put(
          `${apiBaseUrl}/guests/${id}/undo`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const updatedGuest = { ...guest, deleted: false, _pendingSync: true };
        await db.saveGuest(updatedGuest);
        await db.queueAction('UPDATE_GUEST', { id, data: { deleted: false } });
      }
      onUpdate();
      haptic.successFeedback();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore guest');
      haptic.errorFeedback();
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!isOnline) {
      setError('Export is only available online');
      haptic.errorFeedback();
      return;
    }
    window.open(`${apiBaseUrl}/guests/export`, '_blank');
    haptic.mediumFeedback();
  };

  const importCSV = async (e) => {
    if (!isOnline) {
      setError('Import is only available online');
      haptic.errorFeedback();
      e.target.value = null;
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setError('');
    try {
      await axios.post(`${apiBaseUrl}/guests/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      onUpdate();
      haptic.successFeedback();
    } catch (err) {
      setError(err.response?.data?.message || 'Error importing guests');
      haptic.errorFeedback();
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const moveToGroup = async (groupId) => {
    if (!selected.length) return;
    setLoading(true);
    setError('');
    try {
      if (isOnline) {
        await axios.put(
          `${apiBaseUrl}/guests/bulk-update-group`,
          { ids: selected, groupId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const updates = safeGuests.filter((g) => selected.includes(g._id)).map((g) => ({
          ...g,
          groupId,
          _pendingSync: true,
        }));
        await Promise.all(updates.map((g) => db.saveGuest(g)));
        await db.queueAction('BULK_UPDATE_GUESTS', { ids: selected, data: { groupId } });
      }
      setSelected([]);
      onUpdate();
      haptic.successFeedback();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to move guests');
      haptic.errorFeedback();
    } finally {
      setLoading(false);
    }
  };

  const renderMobileGuestList = () => (
    filteredAndSortedGuests.length === 0 ? (
      <div className="text-center py-8 dark:text-white">
        <p>No guests match your filters</p>
      </div>
    ) : (
      <VirtualList
        items={filteredAndSortedGuests}
        itemHeight={110}
        containerHeight="calc(100vh - 280px)"
        renderItem={(guest) => (
          <GuestListItem
            key={guest._id}
            guest={guest}
            isSelected={selected.includes(guest._id)}
            onToggleSelect={() => toggleSelect(guest._id)}
            onEdit={() => setCurrentGuest(guest) || setEditModalOpen(true)}
            onToggleInvited={() => toggleGuestInvited(guest._id, guest.invited)}
            onDelete={() => deleteGuest(guest._id)}
            onRestore={() => undoDelete(guest._id)}
          />
        )}
        keyExtractor={(guest) => guest._id}
      />
    )
  );

  const GuestActions = ({ guest }) => (
    <div className="flex flex-wrap justify-end gap-2 mt-3">
      <button
        onClick={() => setCurrentGuest(guest) || setEditModalOpen(true)}
        className="px-3 py-2 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
        aria-label={`Edit ${guest.name}`}
      >
        Edit
      </button>
      <button
        onClick={() => toggleGuestInvited(guest._id, guest.invited)}
        className={`px-3 py-2 text-sm rounded ${guest.invited ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
        aria-label={guest.invited ? `Uninvite ${guest.name}` : `Invite ${guest.name}`}
      >
        {guest.invited ? 'Uninvite' : 'Invite'}
      </button>
      {guest.deleted ? (
        <button
          onClick={() => undoDelete(guest._id)}
          className="px-3 py-2 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
          aria-label={`Restore ${guest.name}`}
        >
          Restore
        </button>
      ) : (
        <button
          onClick={() => deleteGuest(guest._id)}
          className="px-3 py-2 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
          aria-label={`Delete ${guest.name}`}
        >
          Delete
        </button>
      )}
    </div>
  );

  return (
    <div className="guest-list card animate-fadeIn" ref={scrollContainerRef}>
      <div className={`p-4 md:p-6 ${isMobile ? 'pb-24 safe-area-bottom' : 'pb-6'}`}>
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          {selectedGroup ? `${selectedGroup.name} Guests` : 'All Guests'}
        </h2>
        {!isOnline && (
          <div className="p-3 mb-4 text-sm text-orange-700 bg-orange-100 rounded-lg dark:bg-orange-900 dark:text-orange-200">
            Offline Mode - Some features are limited
          </div>
        )}
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by name or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10 py-3 text-base"
              aria-label="Search guests"
            />
            <svg
              className="absolute left-3 top-3.5 text-gray-400 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {!isMobile && (
            <div className="flex flex-wrap gap-2">
              <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="input">
                <option value="name">Sort by Name</option>
                <option value="contact">Sort by Contact</option>
                <option value="invited">Sort by Invited</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="input">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-2 ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-white'}`}
                aria-label="Switch to card view"
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-white'}`}
                aria-label="Switch to table view"
              >
                Table
              </button>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setFilterSheetOpen(true)} className="btn btn-primary w-full py-3">
              Filter & Sort ({filter})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFilter('all')} className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}>
            All ({safeGuests.length})
          </button>
          <button
            onClick={() => setFilter('invited')}
            className={`btn ${filter === 'invited' ? 'btn-primary' : 'btn-outline'}`}
          >
            Invited ({safeGuests.filter((g) => g.invited).length})
          </button>
          <button
            onClick={() => setFilter('notInvited')}
            className={`btn ${filter === 'notInvited' ? 'btn-primary' : 'btn-outline'}`}
          >
            Not Invited ({safeGuests.filter((g) => !g.invited).length})
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleAll}
              disabled={!paginatedGuests.length}
              className="w-4 h-4"
              aria-label="Select all guests on this page"
            />
            <span className="ml-2 text-sm">Select All</span>
          </label>
          <button
            onClick={() => updateBulkInvited(true)}
            disabled={!selected.length || loading}
            className="btn btn-outline text-sm"
          >
            Mark Invited
          </button>
          <button
            onClick={() => updateBulkInvited(false)}
            disabled={!selected.length || loading}
            className="btn btn-outline text-sm"
          >
            Mark Not Invited
          </button>
          <button
            onClick={exportCSV}
            disabled={loading || !isOnline || !safeGuests.length}
            className={`btn btn-outline text-sm ${!isOnline ? 'opacity-50' : ''}`}
          >
            Export CSV
          </button>
          <label className={`btn btn-outline text-sm ${!isOnline ? 'opacity-50' : ''}`}>
            Import CSV
            <input type="file" accept=".csv" onChange={importCSV} disabled={!isOnline} className="hidden" />
          </label>
          <select
            onChange={(e) => moveToGroup(e.target.value)}
            disabled={!selected.length || loading}
            className="btn btn-outline text-sm"
            value=""
          >
            <option value="" disabled>
              Move to Group
            </option>
            {guestGroups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        {loading && <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg">Processing...</div>}
        {safeGuests.length === 0 ? (
          <div className="text-center py-8 dark:text-white">No guests found. Add your first guest.</div>
        ) : isMobile ? (
          renderMobileGuestList()
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-3 gap-4">
                {paginatedGuests.map((guest) => (
                  <div
                    key={guest._id}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${selected.includes(guest._id) ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex justify-between mb-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(guest._id)}
                          onChange={() => toggleSelect(guest._id)}
                          className="w-5 h-5"
                        />
                        <span className="ml-2 font-medium">{guest.name}</span>
                      </label>
                      <span className={`px-2 py-1 text-xs rounded ${guest.invited ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        {guest.invited ? 'Invited' : 'Not Invited'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{guest.contact || 'No contact'}</p>
                    <GuestActions guest={guest} />
                  </div>
                ))}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3">Select</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Group</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGuests.map((guest) => (
                    <tr key={guest._id}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(guest._id)}
                          onChange={() => toggleSelect(guest._id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4">{guest.name}</td>
                      <td className="px-6 py-4">{guest.contact || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${guest.invited ? 'bg-green-100' : 'bg-yellow-100'}`}>
                          {guest.invited ? 'Invited' : 'Not Invited'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {guestGroups.find((g) => g._id === guest.groupId)?.name || 'No Group'}
                      </td>
                      <td className="px-6 py-4">
                        <GuestActions guest={guest} />
                        <GroupMembershipManager
                          token={token}
                          guest={guest}
                          guestGroups={guestGroups}
                          onUpdate={onUpdate}
                          apiBaseUrl={apiBaseUrl}
                          isOnline={isOnline}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {totalPages > 1 && (
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="btn btn-outline"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="btn btn-outline"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
        <EditGuestModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          guest={currentGuest}
          onUpdate={() => {
            onUpdate();
            toast.success('Guest updated');
          }}
          token={token}
          apiBaseUrl={apiBaseUrl}
          guestGroups={guestGroups}
        />
        <BottomSheet isOpen={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} height="80vh" title="Filter & Sort">
          <GuestFilterSheet
            filter={filter}
            setFilter={setFilter}
            sortField={sortField}
            setSortField={setSortField}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </BottomSheet>
        {isMobile && process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-24 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-50">
            Mobile View
          </div>
        )}
      </div>
    </div>
  );
}

export default GuestList;