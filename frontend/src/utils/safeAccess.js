/**
 * Utilities for safely accessing object properties
 */

/**
 * Safely get a property from an object, with default value if not found
 * 
 * @param {Object} obj - The object to get the property from
 * @param {string} path - The path to the property, e.g. 'user.profile.name'
 * @param {*} defaultValue - The default value to return if the property is not found
 * @returns {*} The property value or the default value
 */
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || !path) return defaultValue;
  
  try {
    const parts = typeof path === 'string' ? path.split('.') : path;
    
    let result = obj;
    for (const part of parts) {
      if (result === undefined || result === null) {
        return defaultValue;
      }
      result = result[part];
    }
    
    return result === undefined ? defaultValue : result;
  } catch (error) {
    console.warn(`Error accessing ${path}:`, error);
    return defaultValue;
  }
};

/**
 * Safely set a property on an object, creating intermediate objects if needed
 * 
 * @param {Object} obj - The object to set the property on
 * @param {string|Array} path - The path to the property
 * @param {*} value - The value to set
 * @returns {Object} The modified object
 */
export const safeSet = (obj, path, value) => {
  if (!obj || !path) return obj;
  
  try {
    const parts = typeof path === 'string' ? path.split('.') : path;
    
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
    return obj;
  } catch (error) {
    console.warn(`Error setting ${path}:`, error);
    return obj;
  }
};

/**
 * Check if a property exists in an object
 * 
 * @param {Object} obj - The object to check
 * @param {string} path - The path to the property
 * @returns {boolean} Whether the property exists
 */
export const safeHas = (obj, path) => {
  if (!obj || !path) return false;
  
  try {
    const parts = typeof path === 'string' ? path.split('.') : path;
    
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current === undefined || current === null) {
        return false;
      }
      current = current[parts[i]];
    }
    
    return current !== undefined && 
           current !== null && 
           Object.prototype.hasOwnProperty.call(current, parts[parts.length - 1]);
  } catch (error) {
    console.warn(`Error checking if ${path} exists:`, error);
    return false;
  }
};

export default {
  get: safeGet,
  set: safeSet,
  has: safeHas
};
