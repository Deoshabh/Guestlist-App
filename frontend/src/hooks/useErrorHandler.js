import { useState, useCallback } from 'react';
import { useToast } from '../components/ToastManager';
import haptic from '../utils/haptic';

/**
 * A hook for centralized error handling across the application
 * Provides consistent error messaging, haptic feedback, and retry functionality
 */
export default function useErrorHandler() {
  const [errors, setErrors] = useState({});
  const [isRetrying, setIsRetrying] = useState(false);
  const toast = useToast();

  // Clear a specific error
  const clearError = useCallback((errorKey) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Handle an error with consistent feedback
  const handleError = useCallback((error, errorKey = 'general', options = {}) => {
    const { 
      showToast = true, 
      useHaptic = true,
      defaultMessage = 'An error occurred',
      context = '' 
    } = options;

    // Get a user-friendly error message
    let errorMessage = defaultMessage;
    
    if (error?.response?.data?.error) {
      // API provided error
      errorMessage = error.response.data.error;
    } else if (error?.message) {
      // JavaScript error
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      // String error
      errorMessage = error;
    }

    // Add context if provided
    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }

    // Update error state
    setErrors(prev => ({
      ...prev,
      [errorKey]: {
        message: errorMessage,
        timestamp: new Date(),
        error
      }
    }));

    // Show toast notification if enabled
    if (showToast) {
      toast.error(errorMessage);
    }

    // Provide haptic feedback if enabled
    if (useHaptic) {
      haptic.errorFeedback();
    }

    return errorMessage;
  }, [toast]);

  // Retry a failed operation
  const retryOperation = useCallback(async (operation, errorKey, options = {}) => {
    const { retryCount = 1, retryDelay = 1000 } = options;
    
    setIsRetrying(true);
    clearError(errorKey);
    
    let attempts = 0;
    let success = false;

    while (attempts < retryCount && !success) {
      try {
        // Wait before retry if this isn't the first attempt
        if (attempts > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
        await operation();
        success = true;
      } catch (error) {
        attempts++;
        
        // Only show toast on final failure
        if (attempts >= retryCount) {
          handleError(error, errorKey, {
            showToast: true,
            context: `Failed after ${retryCount} attempts`
          });
        }
      }
    }
    
    setIsRetrying(false);
    return success;
  }, [clearError, handleError]);

  // Check connectivity before operation
  const withConnectivityCheck = useCallback(async (operation, options = {}) => {
    const { 
      errorKey = 'connectivity', 
      offlineMessage = 'You appear to be offline. This operation requires an internet connection.',
      offlineFallback = null
    } = options;

    if (!navigator.onLine) {
      handleError(offlineMessage, errorKey, { 
        showToast: true, 
        useHaptic: true 
      });
      
      // If there's an offline fallback, execute it
      if (offlineFallback && typeof offlineFallback === 'function') {
        return offlineFallback();
      }
      
      return false;
    }
    
    try {
      return await operation();
    } catch (error) {
      if (!navigator.onLine) {
        // Connection was lost during operation
        handleError('Lost connection during operation', errorKey);
        
        if (offlineFallback && typeof offlineFallback === 'function') {
          return offlineFallback();
        }
      } else {
        // Some other error occurred
        handleError(error, errorKey);
      }
      return false;
    }
  }, [handleError]);

  return {
    errors,
    hasError: Object.keys(errors).length > 0,
    isRetrying,
    handleError,
    clearError,
    clearAllErrors,
    retryOperation,
    withConnectivityCheck
  };
}
