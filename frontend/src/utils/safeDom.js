/**
 * Safe DOM operations utility
 * Provides safer DOM manipulation methods with error handling for mobile devices
 */

const safeDom = {
  /**
   * Safely query for a DOM element
   * @param {string} selector - CSS selector
   * @param {Element} [context=document] - Context element to query within
   * @return {Element|null} The found element or null
   */
  querySelector: (selector, context = document) => {
    try {
      return context.querySelector(selector);
    } catch (err) {
      console.warn(`Error querying for '${selector}':`, err);
      return null;
    }
  },
  
  /**
   * Safely query for multiple DOM elements
   * @param {string} selector - CSS selector
   * @param {Element} [context=document] - Context element to query within
   * @return {Array} Array of elements (empty if error)
   */
  querySelectorAll: (selector, context = document) => {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (err) {
      console.warn(`Error querying for all '${selector}':`, err);
      return [];
    }
  },
  
  /**
   * Safely add an event listener
   * @param {Element} element - Element to attach listener to
   * @param {string} eventType - Event type (click, etc)
   * @param {Function} handler - Event handler
   * @param {Object|boolean} [options] - Event listener options
   * @return {boolean} Success status
   */
  addEventListener: (element, eventType, handler, options) => {
    try {
      if (!element) return false;
      
      // Wrap handler in try/catch for safety
      const safeHandler = (event) => {
        try {
          return handler(event);
        } catch (err) {
          console.error(`Error in ${eventType} handler:`, err);
          // Prevent further propagation if there's an error
          event.stopPropagation();
          event.preventDefault();
        }
      };
      
      // Make touch/wheel events passive by default for better performance
      const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
      let safeOptions = options;
      
      if (passiveEvents.includes(eventType) && 
          (options === undefined || options === false || options === true)) {
        safeOptions = {
          capture: Boolean(options),
          passive: true
        };
      }
      
      element.addEventListener(eventType, safeHandler, safeOptions);
      return true;
    } catch (err) {
      console.warn(`Error adding ${eventType} listener:`, err);
      return false;
    }
  },
  
  /**
   * Safely remove an event listener
   * @param {Element} element - Element to remove listener from
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   * @param {Object|boolean} [options] - Event listener options
   * @return {boolean} Success status
   */
  removeEventListener: (element, eventType, handler, options) => {
    try {
      if (!element) return false;
      element.removeEventListener(eventType, handler, options);
      return true;
    } catch (err) {
      console.warn(`Error removing ${eventType} listener:`, err);
      return false;
    }
  },
  
  /**
   * Safely add/remove/toggle a class
   * @param {Element} element - Element to modify
   * @param {string} className - Class to add/remove/toggle
   * @param {string} action - 'add', 'remove', or 'toggle'
   * @return {boolean} Success status
   */
  modifyClass: (element, className, action = 'toggle') => {
    try {
      if (!element || !element.classList) return false;
      
      switch (action) {
        case 'add':
          element.classList.add(className);
          break;
        case 'remove':
          element.classList.remove(className);
          break;
        case 'toggle':
          element.classList.toggle(className);
          break;
        default:
          console.warn(`Unknown class action: ${action}`);
          return false;
      }
      
      return true;
    } catch (err) {
      console.warn(`Error ${action}ing class '${className}':`, err);
      return false;
    }
  },
  
  /**
   * Safely set an element attribute
   * @param {Element} element - Element to modify
   * @param {string} attr - Attribute name
   * @param {string} value - Attribute value
   * @return {boolean} Success status
   */
  setAttribute: (element, attr, value) => {
    try {
      if (!element) return false;
      element.setAttribute(attr, value);
      return true;
    } catch (err) {
      console.warn(`Error setting attribute '${attr}':`, err);
      return false;
    }
  },
  
  /**
   * Safely get an element attribute
   * @param {Element} element - Element to check
   * @param {string} attr - Attribute name
   * @param {*} defaultValue - Default value if attribute not found
   * @return {string} Attribute value or defaultValue
   */
  getAttribute: (element, attr, defaultValue = '') => {
    try {
      if (!element) return defaultValue;
      const value = element.getAttribute(attr);
      return value !== null ? value : defaultValue;
    } catch (err) {
      console.warn(`Error getting attribute '${attr}':`, err);
      return defaultValue;
    }
  },
  
  /**
   * Safely set element style property
   * @param {Element} element - Element to style
   * @param {string} property - CSS property
   * @param {string} value - CSS value
   * @return {boolean} Success status
   */
  setStyle: (element, property, value) => {
    try {
      if (!element || !element.style) return false;
      element.style[property] = value;
      return true;
    } catch (err) {
      console.warn(`Error setting style '${property}':`, err);
      return false;
    }
  },
  
  /**
   * Safely scroll an element into view
   * @param {Element} element - Element to scroll to
   * @param {Object} [options] - ScrollIntoView options
   * @return {boolean} Success status
   */
  scrollIntoView: (element, options = { behavior: 'smooth', block: 'start' }) => {
    try {
      if (!element) return false;
      element.scrollIntoView(options);
      return true;
    } catch (err) {
      console.warn('Error scrolling into view:', err);
      // Fallback to window.scrollTo if scrollIntoView fails
      try {
        const rect = element.getBoundingClientRect();
        window.scrollTo({
          top: rect.top + window.pageYOffset,
          behavior: options.behavior || 'smooth'
        });
        return true;
      } catch (fallbackErr) {
        console.error('Scroll fallback also failed:', fallbackErr);
        return false;
      }
    }
  }
};

export default safeDom;
