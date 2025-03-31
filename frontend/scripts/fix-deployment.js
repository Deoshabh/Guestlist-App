const fs = require('fs');
const path = require('path');

console.log('Running emergency deployment fix...');

// Force-replace index.js with a known good version
const indexJsContent = `import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
`;

// Check if we're running in the Docker container
const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER;
const basePath = isDocker ? '/app' : process.cwd();

// Force write the fixed files
try {
  fs.writeFileSync(path.join(basePath, 'src/index.js'), indexJsContent);
  console.log('Successfully fixed index.js');
} catch (error) {
  console.error('Error fixing index.js:', error);
}

// Fix other potentially problematic files
const filesToCheck = [
  'src/App.js',
  'src/index.css',
  'src/pages/HomePage.js'
];

filesToCheck.forEach(filePath => {
  try {
    const fullPath = path.join(basePath, filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove any merge conflict markers
      if (content.includes('<<<<<<< HEAD')) {
        content = content.replace(/<<<<<<< HEAD\n([\s\S]*?)=======\n[\s\S]*?>>>>>>>[^\n]*/g, '$1');
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed merge conflicts in ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Deployment fix complete!');
