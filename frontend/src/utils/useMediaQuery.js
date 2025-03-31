import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if a media query matches.
 * @param {string} query - The media query to check against
 * @returns {boolean} Whether the media query matches
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Update the state initially
    setMatches(media.matches);
    
    // Define a callback function to handle changes
    const listener = (e) => {
      setMatches(e.matches);
    };
    
    // Add the listener to handle changes
    media.addEventListener('change', listener);
    
    // Clean up
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};

export default useMediaQuery;
