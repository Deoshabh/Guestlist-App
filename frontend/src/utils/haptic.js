// Haptic feedback utility for touch devices

/**
 * Checks if the device supports vibration
 * @returns {boolean} Whether vibration is supported
 */
const isVibrationSupported = () => {
  return 'vibrate' in navigator;
};

/**
 * Provides a light haptic feedback (short vibration)
 */
const lightFeedback = () => {
  if (isVibrationSupported()) {
    navigator.vibrate(10); // 10ms vibration
  }
};

/**
 * Provides a medium haptic feedback for confirmations
 */
const mediumFeedback = () => {
  if (isVibrationSupported()) {
    navigator.vibrate(35); // 35ms vibration
  }
};

/**
 * Provides a strong haptic feedback for important actions
 */
const strongFeedback = () => {
  if (isVibrationSupported()) {
    navigator.vibrate(50); // 50ms vibration
  }
};

/**
 * Provides an error feedback pattern
 */
const errorFeedback = () => {
  if (isVibrationSupported()) {
    navigator.vibrate([30, 100, 30]); // error pattern
  }
};

/**
 * Provides a success feedback pattern
 */
const successFeedback = () => {
  if (isVibrationSupported()) {
    navigator.vibrate([15, 50, 30]); // success pattern
  }
};

/**
 * Vibrate if supported, with optional pattern
 * @param {number|number[]} pattern - Vibration pattern in milliseconds
 * @returns {boolean} Whether vibration was executed
 */
const vibrate = (pattern) => {
  if (isVibrationSupported()) {
    navigator.vibrate(pattern);
    return true;
  }
  return false;
};

// Define a named const before exporting to avoid anonymous default export warning
const hapticFeedback = {
  isVibrationSupported,
  lightFeedback,
  mediumFeedback,
  strongFeedback,
  errorFeedback,
  successFeedback,
  vibrate
};

export default hapticFeedback;
