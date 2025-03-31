/**
 * Utility for safe data access to prevent application crashes
 * when accessing properties of potentially undefined objects
 */

/**
 * Safely access nested properties of an object without throwing errors
 * 
 * @param {Object} obj - The object to access properties from
 * @param {string} path - The path to the property (e.g. 'user.profile.name')
 * @param {*} defaultValue - The default value to return if the property doesn't exist
 * @returns {*} The property value or the default value
 */
export const safeGet = (obj, path, defaultValue = undefined) => {
  try {
    if (!obj) return defaultValue;
    
    // Handle direct property access
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
    
    return Object.prototype.hasOwnProperty.call(current, keys[keys.length - 1]);
  } catch (error) {
    console.warn(`Error checking if ${path} exists:`, error);
    return false;
  }
};

// Default export for backward compatibility
export default {
  get: safeGet,
  set: safeSet,
  has: safeHas
};
