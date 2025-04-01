import React, { useState, useEffect } from 'react';
import { checkApiConnectivity, disableOfflineMode } from './utils/apiCheck';

// Super simplified App component to ensure rendering
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    checked: false,
    online: false,
    message: 'Checking API connectivity...'
  });
  
  useEffect(() => {
    // Check API status on component mount
    const checkApi = async () => {
      try {
        const isOnline = await checkApiConnectivity();
        setApiStatus({
          checked: true,
          online: isOnline,
          message: isOnline ? 'API is online' : 'API is offline'
        });
        
        // Force disable offline mode if environment variable is set
        if (process.env.REACT_APP_DISABLE_OFFLINE_MODE === 'true') {
          disableOfflineMode();
        }
      } catch (error) {
        setApiStatus({
          checked: true,
          online: false,
          message: `API check error: ${error.message}`
        });
      }
    };
    
    checkApi();
  }, []);
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Guest Manager</h1>
        
        {/* API Status Indicator */}
        <div className={`api-status ${apiStatus.online ? 'online' : 'offline'}`}>
          {apiStatus.message}
          {!apiStatus.online && (
            <button 
              onClick={() => disableOfflineMode()}
              className="btn btn-sm btn-primary ml-2"
            >
              Force Online Mode
            </button>
          )}
        </div>
        
        {/* Rest of your app code */}
      </header>
    </div>
  );
}

export default App;
