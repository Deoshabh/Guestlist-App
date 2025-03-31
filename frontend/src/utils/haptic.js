/**
 * Utilities for haptic feedback
 */

/**
 * Provide light haptic feedback (for small UI interactions)
 */
export const lightFeedback = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(10);
    } catch (error) {
      // Fail silently - haptic feedback is non-critical
    }
  }
};

/**
 * Provide medium haptic feedback (for confirmations)
 */
export const mediumFeedback = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(15);
    } catch (error) {
      // Fail silently - haptic feedback is non-critical
    }
  }
};

/**
 * Provide success haptic feedback (for completed actions)
 */
export const successFeedback = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([10, 30, 10]);
    } catch (error) {
      // Fail silently - haptic feedback is non-critical
    }
  }
};

/**
 * Provide error haptic feedback (for failed actions)
 */
export const errorFeedback = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([50, 30, 50]);
    } catch (error) {
      // Fail silently - haptic feedback is non-critical
    }
  }
};

/**
 * Check if haptic feedback is supported
 * @returns {boolean} Whether haptic feedback is supported
 */
export const isSupported = () => {
  return typeof navigator !== 'undefined' && !!navigator.vibrate;
};

// Export as an object for named imports
const haptic = {
  lightFeedback,
  mediumFeedback,
  successFeedback,
  errorFeedback,
  isSupported
};

export default haptic;
