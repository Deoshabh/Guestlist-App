import React, { createContext, useContext, useState, useCallback } from 'react';

// Create the context with default values to prevent errors when consumed
// without a provider
const ToastContext = createContext({
  showToast: () => {}, // Default no-op function for toast display
  hideToast: () => {}, // Default no-op function for hiding toasts
  toasts: [], // Empty array for toasts
});

// Custom hook to consume the context more easily
export const useToast = () => useContext(ToastContext);

// The provider component that will wrap the application
export const ToastProvider = ({ children }) => {
  // State to store active toasts
  const [toasts, setToasts] = useState([]);
  
  // Function to remove a toast by ID
  const hideToast = useCallback((id) => {
    setToasts((currentToasts) => 
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);
  
  // Function to add a new toast notification
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    // Create a unique ID for this toast
    const id = Date.now();
    
    // Add the new toast to the array
    setToasts((currentToasts) => [
      ...currentToasts,
      { id, message, type, duration },
    ]);
    
    // Automatically remove the toast after the specified duration
    setTimeout(() => {
      hideToast(id);
    }, duration);
    
    return id; // Return ID so it can be used to hide toast programmatically
  }, [hideToast]);

  // Convenience methods for different toast types
  const success = useCallback((message, duration) => 
    showToast(message, 'success', duration), [showToast]);
  
  const error = useCallback((message, duration) => 
    showToast(message, 'error', duration), [showToast]);
  
  const warning = useCallback((message, duration) => 
    showToast(message, 'warning', duration), [showToast]);
  
  const info = useCallback((message, duration) => 
    showToast(message, 'info', duration), [showToast]);

  // The value to be provided to consumers
  const contextValue = {
    toasts,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Basic rendering of toasts - can be enhanced later if needed */}
      <div className="toast-container" style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        zIndex: 9999 
      }}>
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`toast toast-${toast.type}`}
            style={{
              margin: '10px',
              padding: '10px 20px',
              borderRadius: '4px',
              backgroundColor: toast.type === 'error' ? '#f44336' :
                               toast.type === 'success' ? '#4caf50' :
                               toast.type === 'warning' ? '#ff9800' : '#2196f3',
              color: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
