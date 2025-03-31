/**
 * Component Registry for dynamic and lazy loading with error handling
 */
import React, { lazy, Suspense, useState, useEffect } from 'react';

// Store for registered components
const componentStore = new Map();

// Fallback loading component
const DefaultFallback = () => (
  <div className="p-4 text-center">
    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
  </div>
);

// Error component
const DefaultError = ({ message = "Failed to load component" }) => (
  <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-200">
    <p>{message}</p>
  </div>
);

/**
 * Register a component with the registry
 * 
 * @param {string} name - Component name
 * @param {Function|Promise} componentImport - Component or import function
 */
export const registerComponent = (name, componentImport) => {
  if (!name) throw new Error('Component name is required');
  
  // Check if component is already registered
  if (componentStore.has(name)) {
    console.warn(`Component "${name}" is already registered. Overwriting.`);
  }
  
  // Handle both direct components and lazy imports
  const component = typeof componentImport === 'function' && 
                    componentImport.constructor.name !== 'AsyncFunction' &&
                    !('$$typeof' in componentImport)
    ? lazy(() => {
        // Wrap the import in a try/catch
        return new Promise((resolve) => {
          try {
            componentImport()
              .then(module => resolve(module))
              .catch(error => {
                console.error(`Error loading component "${name}":`, error);
                // Return a default error component
                resolve({
                  default: () => <DefaultError message={`Failed to load component: ${name}`} />
                });
              });
          } catch (error) {
            console.error(`Error loading component "${name}":`, error);
            // Return a default error component
            resolve({
              default: () => <DefaultError message={`Failed to load component: ${name}`} />
            });
          }
        });
      })
    : componentImport;
  
  componentStore.set(name, component);
};

/**
 * Get a component from the registry
 * 
 * @param {string} name - Component name
 * @returns {React.ComponentType|null} - Component or null if not found
 */
export const getComponent = (name) => {
  return componentStore.get(name) || null;
};

/**
 * Render a registered component safely
 * 
 * @param {string} name - Component name
 * @param {Object} props - Props to pass to the component
 * @param {React.ReactNode} fallback - Fallback UI while loading
 * @param {React.ReactNode} errorFallback - Fallback UI on error
 */
export const ComponentRenderer = ({ 
  name, 
  props = {}, 
  fallback = <DefaultFallback />,
  errorFallback = null
}) => {
  const [error, setError] = useState(null);
  const Component = getComponent(name);
  
  // Reset error when name changes
  useEffect(() => {
    setError(null);
  }, [name]);
  
  if (error) {
    return errorFallback || <DefaultError message={error.message} />;
  }
  
  if (!Component) {
    return errorFallback || <DefaultError message={`Component "${name}" not found`} />;
  }
  
  // For lazy loaded components, wrap in Suspense
  if (Component.$$typeof === Symbol.for('react.lazy')) {
    return (
      <Suspense fallback={fallback}>
        <ErrorBoundary onError={setError} fallback={errorFallback}>
          <Component {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  }
  
  // For regular components
  return (
    <ErrorBoundary onError={setError} fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

/**
 * Simple error boundary component for catching render errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultError />;
    }

    return this.props.children;
  }
}

/**
 * Custom hook to use a registered component
 * 
 * @param {string} name - Component name
 * @returns {[React.ComponentType|null, boolean, Error|null]} - [Component, isLoading, error]
 */
export const useRegisteredComponent = (name) => {
  const [component, setComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadComponent = async () => {
      if (!name) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to get the component from the registry
        const comp = getComponent(name);
        
        if (!comp) {
          throw new Error(`Component "${name}" not found`);
        }
        
        // If it's a lazy component, try to load it
        if (comp.$$typeof === Symbol.for('react.lazy')) {
          // This will trigger the lazy loading
          // We're not actually using the result here
          await comp._init(comp._payload);
        }
        
        if (isMounted) {
          setComponent(comp);
        }
      } catch (err) {
        console.error(`Error loading component "${name}":`, err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadComponent();
    
    return () => {
      isMounted = false;
    };
  }, [name]);
  
  return [component, isLoading, error];
};

export default {
  registerComponent,
  getComponent,
  ComponentRenderer,
  useRegisteredComponent
};
