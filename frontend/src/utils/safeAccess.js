/**
 * Utility for safe data access to prevent application crashes
 */

// Safely access nested properties
export const safeGet = (obj, path, defaultValue = null) => {
  try {
    if (!obj || typeof obj !== 'object') return defaultValue;
    
    const keys = Array.isArray(path) ? path : path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  } catch (error) {
    console.error('Error in safeGet:', error);
    return defaultValue;
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
  get: safeGet,
  jsonParse: safeJsonParse,
  execute: safeExecute,
  prop: safeProp
};
