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
  
  window.visualViewport.addEventListener('resize', () => {
    // Check if the viewport height significantly decreased
    const heightDiff = window.innerHeight - window.visualViewport.height;
    
    if (heightDiff > 150 && !keyboardVisible) {
      // Keyboard likely appeared
      keyboardVisible = true;
      onShow && onShow(heightDiff);
    } else if (heightDiff < 150 && keyboardVisible) {
      // Keyboard likely disappeared
      keyboardVisible = false;
      onHide && onHide();
    }
  });
};

// Adjust content padding when keyboard shows
export const adjustForKeyboard = (contentSelector) => {
  detectKeyboardVisibility(
    (keyboardHeight) => {
      // Keyboard appeared
      const contentEl = document.querySelector(contentSelector);
      if (contentEl) {
        // Add padding to avoid content being hidden behind keyboard
        contentEl.style.paddingBottom = `${keyboardHeight}px`;
      }
    },
    () => {
      // Keyboard disappeared
      const contentEl = document.querySelector(contentSelector);
      if (contentEl) {
        // Reset padding
        contentEl.style.paddingBottom = '';
      }
    }
  );
};

export default {
  scrollToFocusedInput,
  detectKeyboardVisibility,
  adjustForKeyboard
};
