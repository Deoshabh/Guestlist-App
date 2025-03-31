/**
 * Utility for safe data access to prevent application crashes
 */

/**
 * Safely access nested properties of an object without throwing errors
 * This is especially useful on mobile where undefined object access can cause app crashes
 * 
 * @param {Object} obj - The object to access properties from
 * @param {string} path - The path to the property (e.g. 'user.profile.name')
 * @param {*} defaultValue - The default value to return if the property doesn't exist
 * @returns {*} The property value or the default value
 */
export const safeGet = (obj, path, defaultValue = null) => {
  try {
    if (!obj) return defaultValue;
    
    // Handle direct property access for performance
    if (!path.includes('.')) {
      return obj[path] === undefined ? defaultValue : obj[path];
    }
    
    // Handle nested properties
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result === undefined ? defaultValue : result;
  } catch (error) {
    console.warn(`Error safely accessing ${path}:`, error);
    return defaultValue;
  }
};

/**
 * Safely set a nested property on an object, creating intermediate objects if needed
 * 
 * @param {Object} obj - The object to set the property on
 * @param {string} path - The path to the property (e.g. 'user.profile.name')
 * @param {*} value - The value to set
 * @returns {Object} The updated object
 */
export const safeSet = (obj, path, value) => {
  try {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Handle direct property access
    if (!path.includes('.')) {
      obj[path] = value;
      return obj;
    }
    
    // Handle nested properties
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return obj;
  } catch (error) {
    console.warn(`Error safely setting ${path}:`, error);
    return obj;
  }
};

/**
 * Check if an object has a nested property
 * 
 * @param {Object} obj - The object to check
 * @param {string} path - The path to the property (e.g. 'user.profile.name')
 * @returns {boolean} Whether the property exists
 */
export const safeHas = (obj, path) => {
  try {
    if (!obj) return false;
    
    // Handle direct property access
    if (!path.includes('.')) {
      // Fixed ESLint no-prototype-builtins error
      // Using Object.prototype.hasOwnProperty.call instead of direct method access
      // This prevents issues if the object has a custom hasOwnProperty implementation
      return Object.prototype.hasOwnProperty.call(obj, path);
    }
    
    // Handle nested properties
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || current[key] === null) {
        return false;
      }
      current = current[key];
    }
    
    // Fixed ESLint no-prototype-builtins error
    // Using Object.prototype.hasOwnProperty.call instead of direct method access
    return Object.prototype.hasOwnProperty.call(current, keys[keys.length - 1]);
  } catch (error) {
    console.warn(`Error checking if ${path} exists:`, error);
    return false;
  }
};

// Safely parse JSON data
export const safeJsonParse = (data, defaultValue = null) => {
  try {
    if (!data) return defaultValue;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
};

// Safely execute a function with fallback value on error
export const safeExecute = (fn, fallbackValue = null, ...args) => {
  try {
    if (typeof fn !== 'function') return fallbackValue;
    return fn(...args);
  } catch (error) {
    console.error('Error executing function:', error);
    return fallbackValue;
  }
};

// New helper to detect null objects before accessing properties
export const safeProp = (obj, prop, defaultValue = null) => {
  try {
    if (!obj || typeof obj !== 'object') return defaultValue;
    return obj[prop] !== undefined ? obj[prop] : defaultValue;
  } catch (error) {
    console.error(`Error accessing prop ${prop}:`, error);
    return defaultValue;
  }
};

export default {
  safeGet,
  safeSet,
  safeHas,
  jsonParse: safeJsonParse,
  execute: safeExecute,
  prop: safeProp
};
