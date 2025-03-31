/**
 * Safe API utility for better error handling especially on mobile
 */
import axios from 'axios';

/**
 * Creates an API wrapper with improved error handling and timeouts
 * @param {string} baseURL - Base URL for API requests
 * @param {Object} options - Configuration options
 * @returns {Object} API helper object
 */
const createSafeApi = (baseURL = '', options = {}) => {
  // Default options
  const config = {
    timeout: 15000, // 15 seconds default timeout
    retries: 1, // Number of retries for failed requests
    retryDelay: 1000, // Delay between retries in ms
    offlineQueue: true, // Queue requests when offline
    ...options
  };
  
  // Create axios instance with defaults
  const instance = axios.create({
    baseURL,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  // Add request interceptor
  instance.interceptors.request.use(
    async (request) => {
      // Check for online status before sending non-GET requests
      if (!navigator.onLine && request.method !== 'get' && config.offlineQueue) {
        // Let the app know this request should be queued
        throw new axios.Cancel('OFFLINE_QUEUE');
      }
      return request;
    },
    (error) => Promise.reject(error)
  );
  
  // Add response interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Extract request config
      const originalRequest = error.config;
      
      // If we got a network error, device lost connection
      if (error.message === 'Network Error' && navigator.onLine) {
        console.warn('Network error despite browser reporting online status');
        // Delay slightly and try to redetect network status
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Check if we should retry the request
      if (
        config.retries > 0 && 
        (!originalRequest._retryCount || originalRequest._retryCount < config.retries) &&
        (error.message === 'Network Error' || error.code === 'ECONNABORTED' || error.response?.status >= 500)
      ) {
        // Increment retry count
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        console.log(`Retrying failed request (${originalRequest._retryCount}/${config.retries}):`, 
          originalRequest.url);
        
        // Wait before retrying
        return new Promise(resolve => {
          setTimeout(() => resolve(instance(originalRequest)), config.retryDelay);
        });
      }
      
      // Handle offline queue for mutation requests (POST, PUT, DELETE)
      if (error.message === 'OFFLINE_QUEUE' && 
          ['post', 'put', 'delete', 'patch'].includes(originalRequest.method) && 
          config.offlineQueue) {
        // Return a special response that can be handled by the app
        return Promise.resolve({
          status: 202, // Accepted
          data: { 
            offlineQueued: true, 
            originalRequest
          }
        });
      }
      
      // If all else fails, pass along the error
      return Promise.reject(error);
    }
  );
  
  // Wrapper functions with additional error handling
  return {
    // Send GET request with additional safety
    async get(url, params = {}, requestConfig = {}) {
      try {
        const response = await instance.get(url, { 
          params, 
          ...requestConfig 
        });
        return response.data;
      } catch (error) {
        console.error(`GET ${url} failed:`, error);
        throw error;
      }
    },
    
    // Send POST request with additional safety
    async post(url, data = {}, requestConfig = {}) {
      try {
        const response = await instance.post(url, data, requestConfig);
        return response.data;
      } catch (error) {
        // Check if this was queued for offline
        if (error.response?.data?.offlineQueued) {
          return error.response.data;
        }
        console.error(`POST ${url} failed:`, error);
        throw error;
      }
    },
    
    // Send PUT request with additional safety
    async put(url, data = {}, requestConfig = {}) {
      try {
        const response = await instance.put(url, data, requestConfig);
        return response.data;
      } catch (error) {
        // Check if this was queued for offline
        if (error.response?.data?.offlineQueued) {
          return error.response.data;
        }
        console.error(`PUT ${url} failed:`, error);
        throw error;
      }
    },
    
    // Send DELETE request with additional safety
    async delete(url, requestConfig = {}) {
      try {
        const response = await instance.delete(url, requestConfig);
        return response.data;
      } catch (error) {
        // Check if this was queued for offline
        if (error.response?.data?.offlineQueued) {
          return error.response.data;
        }
        console.error(`DELETE ${url} failed:`, error);
        throw error;
      }
    }
  };
};

export default createSafeApi;
