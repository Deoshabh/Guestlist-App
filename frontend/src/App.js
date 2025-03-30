import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import GuestList from './components/GuestList';
import GuestForm from './components/GuestForm';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [showRegister, setShowRegister] = useState(false);
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ total: 0, invited: 0, pending: 0 });
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use API base URL with environment awareness - correct version to avoid duplicating /api
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '' 
    : '/api';

  // Set default axios base URL
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';
    }
  }, []);

  // Set dark mode class on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchGuests = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.get(`${API_BASE_URL}/guests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuests(res.data);
      
      const statsRes = await axios.get(`${API_BASE_URL}/guests/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Could not connect to server. Please make sure the backend is running.');
      setGuests([]);
      setStats({ total: 0, invited: 0, pending: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchGuests();
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const logout = () => setToken('');

  // Handle Register component
  if (!token && showRegister) {
    return <Register setToken={setToken} setShowRegister={setShowRegister} />;
  }

  // Handle Login
  if (!token) {
    return (
      <Login 
        setToken={setToken} 
        showRegister={showRegister} 
        setShowRegister={setShowRegister} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} isAuthenticated={!!token} logout={logout} />
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 dark:bg-red-900 dark:text-red-200">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Guests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Invited</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.invited}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-200 flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        ) : (
          <>
            <GuestForm token={token} onGuestAdded={fetchGuests} apiBaseUrl={API_BASE_URL} />
            <GuestList token={token} guests={guests} onUpdate={fetchGuests} apiBaseUrl={API_BASE_URL} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
