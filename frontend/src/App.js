import React, { useState } from 'react';

// Super simplified App component to ensure rendering
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Guest Manager</h1>
        {/* Rest of your app code */}
      </header>
    </div>
  );
}

export default App;
