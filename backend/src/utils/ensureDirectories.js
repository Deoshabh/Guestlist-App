const fs = require('fs');
const path = require('path');

/**
 * Ensures that necessary directories exist
 */
exports.ensureDirectoriesExist = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }
};
