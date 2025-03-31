/**
 * Utility functions to improve mobile device compatibility
 * This file consolidates functionality previously split between mobileCompatibility.js and mobileRecovery.js
 */

// Apply runtime patches to fix common mobile-specific issues
export function applyMobilePatches() {
  console.log('[Mobile] Applying mobile compatibility patches');
  
  try {
    // Fix 300ms tap delay on iOS devices
    fixTapDelay();
    
    // Fix viewport issues on iOS
    fixIOSViewport();
    
    // Fix overscroll behavior
    fixOverscroll();
    
    // Add touch-specific optimizations
    addTouchOptimizations();
    
    // Apply iOS PWA specific fixes
    if (isIOSPWA()) {
      fixIOSPWA();
    }
    
    console.log('[Mobile] Mobile compatibility patches applied successfully');
  } catch (error) {
    console.error('[Mobile] Error applying mobile patches:', error);
  }
}

/**
 * Fix 300ms tap delay on iOS devices
 */
function fixTapDelay() {
  // Use fastclick if available, otherwise do some basic optimization
  if (typeof document !== 'undefined') {
    // Add touch-action: manipulation to body
    document.body.style.touchAction = 'manipulation';
    
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      document.head.appendChild(meta);
    }
  }
}

/**
 * Fix viewport issues on iOS
 */
function fixIOSViewport() {
  // Handle iOS viewport height issues and resize events
  if (typeof window !== 'undefined' && isIOS()) {
    window.addEventListener('resize', () => {
      // Fix for iOS vh units issue
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }, { passive: true });
    
    // Initial call
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
}

/**
 * Fix overscroll behavior
 */
function fixOverscroll() {
  if (typeof document !== 'undefined') {
    document.body.style.overscrollBehavior = 'none';
    
    // Prevent pull-to-refresh on mobile
    document.body.addEventListener('touchmove', (e) => {
      if (document.documentElement.scrollTop === 0 && 
          e.touches.length === 1 &&
          e.touches[0].screenY > e.touches[0].clientY) {
        e.preventDefault();
      }
    }, { passive: false });
  }
}

/**
 * Add touch-specific optimizations
 */
function addTouchOptimizations() {
  if (typeof document !== 'undefined') {
    // Add class to body for CSS targeting
    document.body.classList.add('touch-device');
    
    // Apply touch manipulation to common interactive elements
    const touchElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    touchElements.forEach(el => {
      el.style.touchAction = 'manipulation';
    });
  }
}

/**
 * Fix PWA issues on iOS
 */
function fixIOSPWA() {
  if (typeof document !== 'undefined') {
    // Add class to body for iOS PWA
    document.body.classList.add('ios-pwa');
    
    // Prevent text selection in PWA
    document.body.style.webkitUserSelect = 'none';
    document.body.style.webkitTouchCallout = 'none';
  }
}

/**
 * Check if running on iOS
 * @returns {boolean} Whether the device is running iOS
 */
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Check if running as PWA on iOS
 * @returns {boolean} Whether the app is running as a PWA on iOS
 */
export function isIOSPWA() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  
  return isIOS() && window.navigator.standalone === true;
}

// Helper to detect if rendering on a mobile device
export function isMobileDevice() {
  return (
    window.innerWidth <= 768 ||
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window ||
    /Mobi|Android/i.test(navigator.userAgent)
  );
}

// Helper to check if device is in PWA mode
export function isPWAMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true
  );
}

/**
 * Toggles between mobile and desktop view modes
 * This function allows users to manually override the device detection
 * and force either desktop or mobile layout rendering.
 * 
 * @returns {boolean} - Returns true if desktop view is now enabled, false if mobile view
 */
export function toggleDesktopView() {
  try {
    // Check for conflicting implementations
    const hasRecoveryConflict = window.errorRecoveryInitialized || 
                               (typeof window.attemptRecovery === 'function');
    
    // Log conflicts if found in development mode
    if (process.env.NODE_ENV === 'development' && hasRecoveryConflict) {
      console.warn('Potential conflict: Multiple error recovery implementations detected');
    }
    
    const currentValue = localStorage.getItem('forceDesktopView');
    const newValue = currentValue === 'true' ? null : 'true';
    
    if (newValue) {
      localStorage.setItem('forceDesktopView', newValue);
      console.log('Enabled desktop view mode');
      
      // Clean up potential conflicts
      if (hasRecoveryConflict) {
        try {
          // Remove conflicting event listeners if possible
          if (typeof window.__cleanupErrorListeners === 'function') {
            window.__cleanupErrorListeners();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    } else {
      localStorage.removeItem('forceDesktopView');
      console.log('Enabled mobile view mode');
    }
    
    // Reload to apply the changes
    window.location.reload();
    
    return newValue === 'true';
  } catch (error) {
    console.error('Error toggling desktop/mobile view:', error);
    return false;
  }
}

// Check if device is likely a touch device
export const isTouchDevice = () => {
  return ('ontouchstart' in window) || 
    (navigator.maxTouchPoints > 0) || 
    (navigator.msMaxTouchPoints > 0);
};

// Fix for iOS Safari touch event delay
export const fixTouchDelay = () => {
  if (typeof document !== 'undefined') {
    document.addEventListener('touchstart', function() {}, {passive: true});
  }
};

// Apply fixes for mobile compatibility
export const applyMobileFixes = () => {
  // Only apply if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  try {
    // Fix for iOS touch delay
    fixTouchDelay();
    
    // Fix for mobile viewport height issues (iOS Safari address bar)
    fixMobileViewportHeight();
    
    // Fix for double tap zoom on mobile
    fixDoubleTapZoom();
    
    // Fix for swipe gesture handlers
    protectSwipeGestures();
    
    // Fix event bubbling issues on mobile
    fixEventBubbling();
    
    // Add CSS touch-action to improve scrolling
    addTouchActionCSS();
    
    console.log('Applied mobile compatibility fixes');
  } catch (error) {
    console.error('Error applying mobile fixes:', error);
  }
};

// Fix for mobile viewport height issues (iOS Safari address bar)
function fixMobileViewportHeight() {
  try {
    // Fix iOS viewport height issue
    const appHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    window.addEventListener('resize', appHeight);
    window.addEventListener('orientationchange', appHeight);
    appHeight();
  } catch (error) {
    console.error('Error fixing mobile viewport height:', error);
  }
}

// Fix for double tap zoom on mobile
function fixDoubleTapZoom() {
  try {
    // Add CSS for touch-action
    const style = document.createElement('style');
    style.innerHTML = `
      /* Prevent double-tap zoom */
      button, 
      a,
      input[type="button"],
      input[type="submit"],
      input[type="reset"],
      [role="button"],
      .touch-manipulation {
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error('Error fixing double tap zoom:', error);
  }
}

// Protect native swipe gestures from being interrupted
// Fix event bubbling issues on mobile
function fixEventBubbling() {
  try {
    // Add capture phase event listeners to prevent certain events from bubbling incorrectly
    document.addEventListener('touchend', (e) => {
      // Check if target has no-bubble class or attribute
      if (e.target.classList.contains('no-bubble') || 
          e.target.getAttribute('data-no-bubble') === 'true') {
        e.stopPropagation();
      }
    }, true);
  } catch (error) {
    console.error('Error fixing event bubbling:', error);
  }
}

function protectSwipeGestures() {
  try {
    // Add passive event listeners for swipe gestures
    const options = { passive: true };
    document.addEventListener('touchstart', () => {}, options);
    document.addEventListener('touchmove', () => {}, options);
    
    // Add CSS to prevent custom swipe handlers from interfering with native gestures
    const style = document.createElement('style');
    style.innerHTML = `
      /* Allow native swipe gestures on elements that should have them */
      .allow-swipe {
        touch-action: pan-x pan-y;
        -webkit-overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error('Error protecting swipe gestures:', error);
  }
}

// Fix touch action CSS for improved scrolling
function addTouchActionCSS() {
  try {
    // Create a style element
    const style = document.createElement('style');
    style.innerHTML = `
      /* Improvements for touch interactions */
      body {
        -webkit-overflow-scrolling: touch;
      }
      
      .scrollable {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      /* Allow vertical scrolling but prevent horizontal */
      .scroll-y {
        touch-action: pan-y;
        -ms-touch-action: pan-y;
      }
      
      /* Allow horizontal scrolling but prevent vertical */
      .scroll-x {
        touch-action: pan-x;
        -ms-touch-action: pan-x;
      }
      
      /* Improve touch target sizes */
      button,
      .btn,
      [role="button"],
      input[type="checkbox"],
      input[type="radio"],
      input[type="button"],
      input[type="submit"],
      select,
      a {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Safe area insets for newer iOS/Android devices */
      .safe-area-top {
        padding-top: env(safe-area-inset-top);
      }
      
      .safe-area-bottom {
        padding-bottom: env(safe-area-inset-bottom);
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error('Error adding touch action CSS:', error);
  }
}

// Automatically apply mobile fixes when imported
applyMobileFixes();

export default {
  applyMobilePatches,
  isIOS,
  isIOSPWA,
  isMobileDevice,
  isPWAMode,
  toggleDesktopView,
  // Export recovery functions that might have been used from mobileRecovery.js
  attemptRecovery: window.attemptRecovery,
  cleanupErrorListeners: window.__cleanupErrorListeners,
  isTouchDevice,
  fixTouchDelay,
  applyMobileFixes
};
