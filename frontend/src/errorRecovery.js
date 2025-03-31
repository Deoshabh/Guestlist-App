/**
 * STUB IMPLEMENTATION
 * 
 * This is a minimal stub for the errorRecovery module that was deleted due to conflicts.
 * It provides empty implementations to prevent build errors.
 * 
 * TODO: This file should eventually be properly reimplemented or all references should be removed.
 */

console.warn('[STUB] errorRecovery.js is a stub implementation. Replace with proper implementation or remove references.');

/**
 * Stub recovery function that does nothing
 */
export const recoverFromError = (error) => {
  console.warn('[STUB] recoverFromError called with:', error);
  return false;
};

/**
 * Stub cleanup function that does nothing
 */
export const cleanupErrorListeners = () => {
  console.warn('[STUB] cleanupErrorListeners called');
  return true;
};

// For code that may use this as a default export
const errorRecovery = {
  recoverFromError,
  cleanupErrorListeners,
  isSupported: false
};

export default errorRecovery;
