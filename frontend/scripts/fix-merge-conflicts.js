const fs = require('fs');
const path = require('path');

// Files that are known to have merge conflicts
const filesToCheck = [
  'src/index.js',
  'src/App.js',
  'src/index.css',
  'src/pages/HomePage.js'
];

console.log('Checking for merge conflicts...');

filesToCheck.forEach(relativeFilePath => {
  const filePath = path.join(process.cwd(), relativeFilePath);
  
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if the file has merge conflict markers
      const hasConflicts = content.includes('<<<<<<< HEAD') || 
                          content.includes('=======') || 
                          content.includes('>>>>>>>');
      
      if (hasConflicts) {
        console.log(`Found merge conflicts in ${relativeFilePath}. Fixing...`);
        
        // Remove merge conflict sections and keep the HEAD version
        content = content.replace(/<<<<<<< HEAD\n([\s\S]*?)=======\n[\s\S]*?>>>>>>>[^\n]*/g, '$1');
        
        fs.writeFileSync(filePath, content);
        console.log(`Fixed merge conflicts in ${relativeFilePath}`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${relativeFilePath}:`, error);
  }
});

console.log('Merge conflict check completed.');
