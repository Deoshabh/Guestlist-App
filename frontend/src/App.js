import React, { useState } from 'react';

// Super simplified App component to ensure rendering
function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Simulate loading state to match the existing UI
  React.useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
  }, []);

  if (!isLoaded) {
    return null; // Let the loading screen from index.html show
  }

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#3498db' }}>Guest Manager</h1>
      </header>

      <main>
        <div style={{ 
          background: 'white', 
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2>Welcome to Guest Manager</h2>
          <p>Your application is loading properly. The simplified version is showing to verify the frontend can render.</p>
          
          <div style={{ marginTop: '20px' }}>
            <h3>Guest List Sample</h3>
            <ul style={{ padding: '0', listStyle: 'none' }}>
              {['John Doe', 'Jane Smith', 'Robert Johnson'].map((name, index) => (
                <li key={index} style={{ 
                  padding: '10px', 
                  border: '1px solid #eee', 
                  marginBottom: '8px',
                  borderRadius: '4px'
                }}>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;