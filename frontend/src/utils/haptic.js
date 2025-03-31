/**
 * Haptic feedback utility for tactile feedback on user interactions
 */

// Check if the vibration API is available
const hasVibration = 'vibrate' in navigator;

// Vibration patterns in milliseconds
const patterns = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 30, 10],
  error: [50, 20, 50],
  warning: [20, 10, 20, 10],
  doubleLight: [10, 30, 10],
  triple: [10, 30, 10, 30, 10],
};

/**
 * Apply haptic feedback
 * @param {Array|number} pattern - Vibration pattern in milliseconds
 */
const vibrate = (pattern) => {
  if (hasVibration) {
    navigator.vibrate(pattern);
  }
};

/**
 * Light haptic feedback (small tap)
 */
const lightFeedback = () => {
  vibrate(patterns.light);
};

/**
 * Medium haptic feedback
 */
const mediumFeedback = () => {
  vibrate(patterns.medium);
};

/**
 * Heavy haptic feedback
 */
const heavyFeedback = () => {
  vibrate(patterns.heavy);
};

/**
 * Success haptic feedback pattern
 */
const successFeedback = () => {
  vibrate(patterns.success);
};

/**
 * Error haptic feedback pattern
 */
const errorFeedback = () => {
  vibrate(patterns.error);
};

/**
 * Warning haptic feedback pattern
 */
const warningFeedback = () => {
  vibrate(patterns.warning);
};

/**
 * Double tap feedback pattern
 */
const doubleFeedback = () => {
  vibrate(patterns.doubleLight);
};

/**
 * Triple tap feedback pattern
 */
const tripleFeedback = () => {
  vibrate(patterns.triple);
};

// Export haptic feedback functions
export default {
  lightFeedback,
  mediumFeedback,
  heavyFeedback,
  successFeedback,
  errorFeedback,
  warningFeedback,
  doubleFeedback,
  tripleFeedback,
  vibrate
};
