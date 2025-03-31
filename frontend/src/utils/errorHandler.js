/**
 * Centralized error handling utility for API calls
 */

/**
 * Handle API errors with consistent error messages
 * @param {Error} error - The error from an API call
 * @param {string} operation - The operation being performed
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error, operation = 'API operation') => {
  // Default error message
  let message = `Error during ${operation}`;
  let statusCode = 500;
  let details = null;

  // Extract more specific error info if available
  if (error.response) {
    // The server responded with a status code outside the 2xx range
    statusCode = error.response.status;
    details = error.response.data;
    
    switch (statusCode) {
      case 400:
        message = 'Invalid request data';
        break;
      case 401:
        message = 'Authentication required';
        break;
      case 403:
        message = 'You do not have permission to perform this action';
        break;
      case 404:
        message = 'The requested resource was not found';
        break;
      case 409:
        message = 'Conflict with current state of the resource';
        break;
      case 422:
        message = 'Validation error';
        break;
      case 429:
        message = 'Too many requests, please try again later';
        break;
      default:
        if (statusCode >= 500) {
          message = 'Server error, please try again later';
        }
    }
    
    // Use the server-provided message if available
    if (details && details.message) {
      message = details.message;
    }
  } else if (error.request) {
    // The request was made but no response was received
    message = 'Server did not respond, please check your connection';
    statusCode = 0;
  }

  // Log the error for debugging
  console.error(`API Error (${operation}):`, error);

  // Return standardized error object
  return {
    message,
    statusCode,
    details,
    originalError: error
  };
};

export default {
  handleApiError
};
