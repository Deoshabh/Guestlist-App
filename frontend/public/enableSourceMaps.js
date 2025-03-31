/**
 * Dynamically enables source maps for debugging in production mode
 */
(function() {
  console.log('Enabling source maps for debugging...');
  
  // Find all script elements
  const scripts = document.getElementsByTagName('script');
  
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const src = script.getAttribute('src');
    
    // Skip if no src or already has sourcemap
    if (!src || src.includes('enableSourceMaps.js')) continue;
    
    // Create a new script element with sourceMappingURL
    if (src.endsWith('.js') && !src.includes('sourceMappingURL')) {
      console.log(`Adding sourcemap for: ${src}`);
      
      const sourceMapScript = document.createElement('script');
      sourceMapScript.textContent = `//# sourceMappingURL=${src}.map`;
      document.head.appendChild(sourceMapScript);
    }
  }
})();
