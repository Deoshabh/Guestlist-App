/**
 * Utility to handle mobile keyboard behaviors.
 * This helps with smooth scrolling and viewport adjustments when the keyboard appears.
 */

// Scroll to the focused input when the keyboard appears
export const scrollToFocusedInput = () => {
  // Only run on mobile devices
  if (window.innerWidth > 768) return;
  
  // Add event listeners for focus events on input fields
  document.addEventListener('focusin', (e) => {
    // Check if the focused element is an input, textarea, or select
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      // Wait for the keyboard to appear
      setTimeout(() => {
        // Scroll to put the input in view, with some buffer space
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  });
};

// Detect keyboard visibility changes
export const detectKeyboardVisibility = (onShow, onHide) => {
  // Only works reliably on iOS and some Android devices
  if (!window.visualViewport) return;
  
  let keyboardVisible = false;
  let lastHeight = window.visualViewport.height;
  
  window.visualViewport.addEventListener('resize', () => {
    const currentHeight = window.visualViewport.height;
    
    // If the height significantly decreases, the keyboard is probably showing
    if (lastHeight > currentHeight && lastHeight - currentHeight > 150) {
      if (!keyboardVisible) {
        keyboardVisible = true;
        if (typeof onShow === 'function') {
          onShow(currentHeight);
        }
      }
    } 
    // If the height significantly increases, the keyboard is probably hiding
    else if (lastHeight < currentHeight && currentHeight - lastHeight > 150) {
      if (keyboardVisible) {
        keyboardVisible = false;
        if (typeof onHide === 'function') {
          onHide();
        }
      }
    }
    
    lastHeight = currentHeight;
  });
};

// Implement fixes for iOS keyboard issues
export const fixIOSKeyboardScrolling = () => {
  if (!window.visualViewport) return;
  
  // Create a placeholder for focus target
  const createFocusTarget = () => {
    const target = document.createElement('input');
    target.setAttribute('type', 'text');
    target.style.position = 'absolute';
    target.style.opacity = '0';
    target.style.height = '0';
    target.style.width = '0';
    target.style.left = '-1000px';
    target.style.top = '0';
    target.id = 'keyboard-focus-target';
    document.body.appendChild(target);
    
    return target;
  };
  
  // Add listener for moving viewport when keyboard shows
  window.visualViewport.addEventListener('resize', () => {
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.tagName === 'SELECT') {
      
      // Wait a bit for the keyboard to stabilize
      setTimeout(() => {
        // Ensure active element is visible
        document.activeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  });
  
  // Handle blur events to close keyboard properly on iOS
  document.addEventListener('touchend', (e) => {
    if (!e.target.closest('input, textarea, select')) {
      // Blur any focused input to hide keyboard
      if (document.activeElement && 
          (document.activeElement.tagName === 'INPUT' ||
           document.activeElement.tagName === 'TEXTAREA' ||
           document.activeElement.tagName === 'SELECT')) {
        document.activeElement.blur();
      }
    }
  });
  
  // Prevent the page from jumping on iOS when focusing inputs near the bottom
  let focusTarget = document.getElementById('keyboard-focus-target');
  if (!focusTarget) {
    focusTarget = createFocusTarget();
  }
};

// Apply all keyboard fixes for mobile
export const applyKeyboardFixes = () => {
  // Only apply on mobile
  if (window.innerWidth > 768) return;
  
  // Apply iOS fixes
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    fixIOSKeyboardScrolling();
  }
  
  // Apply general mobile keyboard fixes
  scrollToFocusedInput();
  
  // Handle keyboard visibility changes
  detectKeyboardVisibility(
    (viewportHeight) => {
      // Keyboard shown
      document.body.classList.add('keyboard-visible');
      document.body.style.height = `${viewportHeight}px`;
    },
    () => {
      // Keyboard hidden
      document.body.classList.remove('keyboard-visible');
      document.body.style.height = '';
    }
  );
  
  return true;
};

export default {
  scrollToFocusedInput,
  detectKeyboardVisibility,
  fixIOSKeyboardScrolling,
  applyKeyboardFixes
};
