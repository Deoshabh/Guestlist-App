import React from 'react';
<<<<<<< HEAD
import GuestStatsCards from '../components/GuestStatsCards';
import GuestContactManager from '../components/GuestContactManager';
import PendingGuestsList from '../components/PendingGuestsList';
import GuestListManager from '../components/GuestListManager';
import GuestForm from '../components/GuestForm';
import GuestList from '../components/GuestList';
import LoadingIndicator from '../components/LoadingIndicator';
import { useGuests } from '../contexts/GuestContext';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';

const HomePage = () => {
  const { token } = useAuth();
  const { API_BASE_URL, isOnline } = useNetwork();
  const { 
    guests, 
    loading, 
    guestGroups,
    selectedGroup, 
    setSelectedGroup,
    pendingGuests,
    handleContactsImported,
    handleUpdatePendingGuest,
    handleRemovePendingGuest,
    handleAddToPendingList,
    handleSaveAllPendingGuests,
    handleCancelAllPendingGuests,
    fetchGuests
  } = useGuests();

  return (
    <div>
      {/* Stats cards */}
      <GuestStatsCards />
      
      {loading ? (
        <LoadingIndicator />
      ) : (
        <>
          {/* Guest Contact Manager for phonebook integration */}
          <GuestContactManager onContactsImported={handleContactsImported} />
          
          {/* Pending Guests List */}
          <PendingGuestsList
            pendingGuests={pendingGuests}
            onUpdatePendingGuest={handleUpdatePendingGuest}
            onRemovePendingGuest={handleRemovePendingGuest}
            onSaveAll={handleSaveAllPendingGuests}
            onCancelAll={handleCancelAllPendingGuests}
          />
          
          {/* Display the multi-guest mode button when no pending guests */}
          {pendingGuests.length === 0 ? (
            <>
              {/* Guest Groups Management */}
              <div className="guest-groups">
                <GuestListManager
                  token={token}
                  apiBaseUrl={API_BASE_URL}
                  isOnline={isOnline}
                  selectedGroup={selectedGroup}
                  setSelectedGroup={setSelectedGroup}
                  guests={guests}
                />
              </div>
              
              {/* Guest Form with group selection */}
              <GuestForm
                token={token}
                onGuestAdded={fetchGuests}
                apiBaseUrl={API_BASE_URL}
                isOnline={isOnline}
                selectedGroup={selectedGroup}
                guestGroups={guestGroups}
                onAddMultiple={handleAddToPendingList}
              />
              
              {/* Guest List filtered by selected group */}
              <GuestList
                token={token}
                guests={guests}
                onUpdate={fetchGuests}
                apiBaseUrl={API_BASE_URL}
                isOnline={isOnline}
                selectedGroup={selectedGroup}
                guestGroups={guestGroups}
              />
            </>
          ) : (
            <div className="mt-4 mb-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700 dark:text-blue-200">
                Please review and save your pending guests before continuing.
              </p>
            </div>
          )}
        </>
      )}
=======

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Bhaujan Vypar</h1>
          <p>Your platform for business growth and success</p>
        </div>
      </section>
      
      <section className="features">
        <div className="feature-card">
          <h3>Business Networking</h3>
          <p>Connect with other businesses and entrepreneurs</p>
        </div>
        <div className="feature-card">
          <h3>Resource Sharing</h3>
          <p>Access educational resources and business tools</p>
        </div>
        <div className="feature-card">
          <h3>Community Support</h3>
          <p>Get support from a thriving community</p>
        </div>
      </section>
>>>>>>> 65ec56d (Initial)
    </div>
  );
};

export default HomePage;
