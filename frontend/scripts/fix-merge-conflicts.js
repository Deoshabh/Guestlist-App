const fs = require('fs');
const path = require('path');

/**
 * Script to detect and fix Git merge conflict markers in source files
 */
function fixMergeConflicts() {
  console.log('🔍 Scanning for Git merge conflict markers...');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const conflictPattern = /(<<<<<<< HEAD|=======|>>>>>>> .*)/;
  
  let fixedFiles = 0;
  let foundConflicts = false;
  
  function scanDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        scanDirectory(filePath); // Recursively scan subdirectories
      } else if (stats.isFile()) {
        // Check files with these extensions
        if (['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'].some(ext => file.endsWith(ext))) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            
            if (conflictPattern.test(content)) {
              foundConflicts = true;
              console.log(`⚠️ Found merge conflict in: ${filePath}`);
              
              // Simple resolution: keep HEAD content (between <<<<<<< HEAD and =======)
              const fixedContent = resolveConflict(content);
              fs.writeFileSync(filePath, fixedContent, 'utf-8');
              
              console.log(`✅ Fixed merge conflict in: ${filePath}`);
              fixedFiles++;
            }
          } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
          }
        }
      }
    }
  }
  
  function resolveConflict(content) {
    // Strategy: keep content between <<<<<<< HEAD and =======, discard the rest
    let result = '';
    let inConflict = false;
    let keepContent = true;
    
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('<<<<<<< HEAD')) {
        inConflict = true;
        keepContent = true;
        continue;
      }
      
      if (line.includes('=======')) {
        keepContent = false;
        continue;
      }
      
      if (line.includes('>>>>>>>')) {
        inConflict = false;
        keepContent = true;
        continue;
      }
      
      if (!inConflict || keepContent) {
        result += line + '\n';
      }
    }
    
    return result;
  }
  
  try {
    scanDirectory(srcDir);
    
    if (foundConflicts) {
      console.log(`🎉 Fixed ${fixedFiles} files with merge conflicts`);
    } else {
      console.log('✅ No merge conflicts found');
    }
  } catch (error) {
    console.error('Error scanning for merge conflicts:', error);
    process.exit(1);
  }
}

fixMergeConflicts();
