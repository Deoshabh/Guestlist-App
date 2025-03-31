import axios from 'axios';
import { useNetwork } from '../contexts/NetworkContext';

// Create axios instance with default configuration
const createApiInstance = (baseURL, token = null) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000, // 10 second timeout
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  // Add request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Add timestamp to prevent caching
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now(),
        };
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

// Custom hook to use API with network context
export const useApi = (token = null) => {
  const { API_BASE_URL, handleCorsError, isOnline } = useNetwork();
  
  const apiInstance = createApiInstance(API_BASE_URL, token);
  
  // Add response interceptor to handle CORS errors
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Check if it's a CORS error
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        console.warn('CORS or network error detected:', error);
        // Call the handler function from NetworkContext
        handleCorsError();
      }
      return Promise.reject(error);
    }
  );
  
  return {
    apiInstance,
    isOnline,
    
    // Wrapper methods with offline check
    async get(url, config = {}) {
      if (!isOnline) {
        console.log('GET request skipped in offline mode:', url);
        return Promise.reject(new Error('App is in offline mode'));
      }
      return apiInstance.get(url, config);
    },
    
    async post(url, data, config = {}) {
      if (!isOnline) {
        console.log('POST request skipped in offline mode:', url);
        return Promise.reject(new Error('App is in offline mode'));
      }
      return apiInstance.post(url, data, config);
    },
    
    async put(url, data, config = {}) {
      if (!isOnline) {
        console.log('PUT request skipped in offline mode:', url);
        return Promise.reject(new Error('App is in offline mode'));
      }
      return apiInstance.put(url, data, config);
    },
    
    async delete(url, config = {}) {
      if (!isOnline) {
        console.log('DELETE request skipped in offline mode:', url);
        return Promise.reject(new Error('App is in offline mode'));
      }
      return apiInstance.delete(url, config);
    },
  };
};
