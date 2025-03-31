/**
 * Script to reset the force offline mode in localStorage
 * This script should be run before starting the development server
 */

console.log('🔄 Resetting offline mode...');

// In browser context, we can't directly modify localStorage
// This script outputs instructions for the developer
console.log(`
To fix API connectivity issues, run this code in your browser's console:

localStorage.setItem('forceOfflineMode', 'false');
localStorage.setItem('guest-app-initialized', 'true');

Then refresh the page.

Alternatively, to completely reset the application storage:

localStorage.clear();

`);

// If we're in a Node.js environment with DOM access (e.g. using JSDOM)
// This would work automatically
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('forceOfflineMode', 'false');
    window.localStorage.setItem('guest-app-initialized', 'true');
    console.log('✅ Successfully reset offline mode in localStorage!');
  }
} catch (error) {
  // This will likely fail in Node.js without a DOM implementation
  console.log('Could not automatically reset localStorage (expected in Node.js)');
}

console.log('✅ Done!');
