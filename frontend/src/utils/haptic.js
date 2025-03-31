/**
 * Utility for providing haptic feedback on actions
 * Falls back gracefully when browser doesn't support vibration API
 */

// Check if vibration API is supported
const hasVibrationSupport = () => {
  return 'vibrate' in navigator;
};

// Vibration patterns
const VIBRATION_PATTERNS = {
  LIGHT: 10,
  MEDIUM: 25,
  ERROR: [30, 50, 30],
  SUCCESS: [20, 40, 60],
  WARNING: [40, 30, 40]
};

// Trigger vibration with pattern
const vibrate = (pattern) => {
  if (hasVibrationSupport() && !localStorage.getItem('haptic_disabled')) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Failed to trigger haptic feedback:', error);
    }
  }
};

/**
 * Light feedback for simple interactions like selections
 */
const lightFeedback = () => {
  vibrate(VIBRATION_PATTERNS.LIGHT);
};

/**
 * Medium feedback for confirming actions
 */
const mediumFeedback = () => {
  vibrate(VIBRATION_PATTERNS.MEDIUM);
};

/**
 * Error feedback for when something goes wrong
 */
const errorFeedback = () => {
  vibrate(VIBRATION_PATTERNS.ERROR);
};

/**
 * Success feedback for completed actions
 */
const successFeedback = () => {
  vibrate(VIBRATION_PATTERNS.SUCCESS);
};

/**
 * Warning feedback
 */
const warningFeedback = () => {
  vibrate(VIBRATION_PATTERNS.WARNING);
};

/**
 * Disable all haptic feedback
 */
const disableHaptics = () => {
  localStorage.setItem('haptic_disabled', 'true');
};

/**
 * Enable haptic feedback
 */
const enableHaptics = () => {
  localStorage.removeItem('haptic_disabled');
};

/**
 * Check if haptics are currently enabled
 */
const isHapticsEnabled = () => {
  return !localStorage.getItem('haptic_disabled');
};

/**
 * Toggle haptic feedback on/off
 */
const toggleHaptics = () => {
  if (isHapticsEnabled()) {
    disableHaptics();
  } else {
    enableHaptics();
  }
  return isHapticsEnabled();
};

export default {
  lightFeedback,
  mediumFeedback,
  errorFeedback,
  successFeedback,
  warningFeedback,
  isHapticsEnabled,
  enableHaptics,
  disableHaptics,
  toggleHaptics
};
