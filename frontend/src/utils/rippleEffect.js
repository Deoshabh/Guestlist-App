/**
 * Creates a ripple effect on an element
 * @param {HTMLElement} button - The button to apply the effect to
 * @param {Event} event - The event that triggered the effect
 */
export function createRipple(button, event) {
  const rect = button.getBoundingClientRect();
  
  // Get the position of the click relative to the button
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Calculate the ripple size (should be at least as large as the button)
  const diameter = Math.max(rect.width, rect.height) * 2;
  
  // Create the ripple element
  const ripple = document.createElement('span');
  ripple.style.width = `${diameter}px`;
  ripple.style.height = `${diameter}px`;
  ripple.style.left = `${x - diameter / 2}px`;
  ripple.style.top = `${y - diameter / 2}px`;
  ripple.classList.add('ripple');
  
  // Check if the button already has a ripple and remove it
  const existingRipple = button.querySelector('.ripple');
  if (existingRipple) {
    existingRipple.remove();
  }
  
  // Add the ripple to the button
  button.appendChild(ripple);
  
  // Remove the ripple after the animation
  setTimeout(() => {
    ripple.remove();
  }, 600); // Match the animation duration
}

/**
 * Adds a ripple effect to all buttons with the .ripple-button class
 */
export function setupRippleEffect() {
  // Find all elements with the ripple-button class
  const buttons = document.querySelectorAll('.ripple-button');
  
  // Add event listeners to each button
  buttons.forEach(button => {
    button.addEventListener('mousedown', event => createRipple(button, event));
    button.addEventListener('touchstart', event => {
      const touch = event.touches[0];
      createRipple(button, touch);
    }, { passive: true });
  });
}

/**
 * Initializes ripple effects when the DOM is loaded
 */
export function initRippleEffects() {
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') {
      setupRippleEffect();
    } else {
      window.addEventListener('DOMContentLoaded', setupRippleEffect);
    }
    
    // Re-setup on any DOM changes that might add new buttons
    const observer = new MutationObserver(() => {
      setupRippleEffect();
    });
    
    // Start observing once the DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
}

export default {
  createRipple,
  setupRippleEffect,
  initRippleEffects
};
