import React from 'react';

/**
 * Utilities for safely rendering components, especially on mobile
 */

/**
 * Safely renders children with null/undefined checks
 * 
 * @param {React.ReactNode} children - Children to render
 * @param {React.ReactNode} fallback - Fallback UI if children can't be rendered
 * @returns {React.ReactNode} Safely rendered content
 */
export const safeRender = (children, fallback = null) => {
  try {
    // Check if children is null or undefined
    if (children == null) {
      return fallback;
    }
    
    // Render children normally
    return children;
  } catch (error) {
    console.error('Error rendering children:', error);
    return fallback;
  }
};

/**
 * Renders a list of items safely with proper keys
 * 
 * @param {Array<any>} items - Array of items to render
 * @param {Function} renderItem - Function to render each item
 * @param {Function} extractKey - Function to extract key from each item
 * @param {React.ReactNode} emptyFallback - UI to show when array is empty
 * @returns {React.ReactNode} Safely rendered list
 */
export const safeRenderList = (
  items, 
  renderItem, 
  extractKey = (item, index) => index,
  emptyFallback = null
) => {
  try {
    // Return fallback for null/undefined arrays
    if (!items) return emptyFallback;
    
    // Ensure items is an array
    const safeItems = Array.isArray(items) ? items : [];
    
    // Return fallback for empty arrays
    if (safeItems.length === 0) return emptyFallback;
    
    // Render items safely with proper keys
    return safeItems.map((item, index) => {
      try {
        const key = extractKey(item, index);
        return (
          <React.Fragment key={key}>
            {renderItem(item, index)}
          </React.Fragment>
        );
      } catch (itemError) {
        console.error(`Error rendering item at index ${index}:`, itemError);
        return null;
      }
    });
  } catch (error) {
    console.error('Error rendering list:', error);
    return emptyFallback;
  }
};

/**
 * HOC that wraps a component with safe rendering logic
 * 
 * @param {React.ComponentType} Component - Component to wrap
 * @param {React.ReactNode} fallback - Fallback UI when rendering fails
 * @returns {React.ComponentType} Wrapped component with safe rendering
 */
export const withSafeRendering = (Component, fallback = null) => {
  const SafeComponent = (props) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      console.error(`Error rendering ${Component.displayName || Component.name || 'component'}:`, error);
      return fallback;
    }
  };
  
  // Set display name for easier debugging
  const displayName = Component.displayName || Component.name || 'Component';
  SafeComponent.displayName = `SafeRender(${displayName})`;
  
  return SafeComponent;
};

export default {
  safeRender,
  safeRenderList,
  withSafeRendering
};
