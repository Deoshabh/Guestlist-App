const fs = require('fs');
const path = require('path');

// List of critical files that must exist before building
const criticalFiles = [
  'src/index.js',
  'src/App.js',
  'src/reportWebVitals.js',
  'src/serviceWorkerRegistration.js'
];

console.log('Verifying critical files before build...');
let missingFiles = [];

criticalFiles.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
    console.error(`Missing critical file: ${file}`);
  }
});

if (missingFiles.length > 0) {
  process.exit(1); // Exit with error
} else {
  console.log('All critical files present. Proceeding with build.');
}
