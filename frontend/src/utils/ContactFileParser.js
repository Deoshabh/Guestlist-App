/**
 * Utility for parsing contact files (CSV, VCF)
 */

/**
 * Parse a CSV file containing contacts
 * @param {File} file - The CSV file to parse
 * @returns {Promise<Array>} - Array of parsed contacts
 */
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const result = [];
        
        // Check if the file has a header row
        const firstLine = lines[0].trim();
        const hasHeader = /name|email|phone|contact|tel/i.test(firstLine);
        
        // Start parsing from the appropriate row
        const startIndex = hasHeader ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Split the line by comma, accounting for commas within quotes
          let parts = [];
          let inQuotes = false;
          let currentPart = '';
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              parts.push(currentPart);
              currentPart = '';
            } else {
              currentPart += char;
            }
          }
          
          parts.push(currentPart); // Add the last part
          
          // Remove quotes from parts
          const cleanParts = parts.map(part => part.replace(/^"(.*)"$/, '$1').trim());
          
          // Try to determine which columns contain what data
          let name = '', email = '', phone = '';
          
          if (hasHeader) {
            // Use header to determine column order
            const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
            
            headers.forEach((header, index) => {
              if (index >= cleanParts.length) return;
              
              if (/name/i.test(header)) {
                name = cleanParts[index];
              } else if (/email/i.test(header)) {
                email = cleanParts[index];
              } else if (/phone|tel|mobile/i.test(header)) {
                phone = cleanParts[index];
              }
            });
          } else {
            // Best guess: first column is name, then email, then phone
            name = cleanParts[0] || '';
            email = cleanParts.length > 1 ? cleanParts[1] : '';
            phone = cleanParts.length > 2 ? cleanParts[2] : '';
          }
          
          if (name) {
            // Split name into first and last if possible
            const nameParts = name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            result.push({
              name,
              firstName,
              lastName,
              email,
              phone,
              // Match format from ContactsHelper
              tel: phone ? [phone] : [],
              emailAddresses: email ? [email] : []
            });
          }
        }
        
        resolve(result);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        reject(new Error('Failed to parse CSV file. Please check the file format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse a VCF file containing contacts
 * @param {File} file - The VCF file to parse
 * @returns {Promise<Array>} - Array of parsed contacts
 */
export const parseVCF = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const vcf = event.target.result;
        const contacts = [];
        
        // Split the file into individual vCards
        const vCards = vcf.split('BEGIN:VCARD');
        
        for (let i = 1; i < vCards.length; i++) { // Skip the first empty split
          const vCard = 'BEGIN:VCARD' + vCards[i];
          const contact = parseVCard(vCard);
          if (contact.name) {
            contacts.push(contact);
          }
        }
        
        resolve(contacts);
      } catch (error) {
        console.error('Error parsing VCF:', error);
        reject(new Error('Failed to parse VCF file. Please check the file format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse a single vCard entry
 * @param {string} vCard - The vCard text
 * @returns {Object} - The parsed contact
 */
function parseVCard(vCard) {
  const lines = vCard.split('\n').map(line => line.trim());
  let name = '', firstName = '', lastName = '', email = '', phone = '';
  
  for (const line of lines) {
    if (line.startsWith('FN:')) {
      // Full Name
      name = line.substring(3).trim();
    } else if (line.startsWith('N:')) {
      // Structured Name (Last;First;Middle;Prefix;Suffix)
      const nameParts = line.substring(2).split(';');
      lastName = nameParts[0] || '';
      firstName = nameParts[1] || '';
      
      // If we didn't get a FN, construct from N
      if (!name) {
        name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
      }
    } else if (line.startsWith('EMAIL')) {
      // Email - take the part after the colon
      const match = line.match(/:(.*?)(?:;|$)/);
      if (match && match[1]) {
        email = match[1].trim();
      }
    } else if (line.startsWith('TEL')) {
      // Phone - take the part after the colon
      const match = line.match(/:(.*?)(?:;|$)/);
      if (match && match[1]) {
        phone = match[1].trim();
      }
    }
  }
  
  // Ensure we have a workable name
  if (!name && (firstName || lastName)) {
    name = [firstName, lastName].filter(Boolean).join(' ');
  }
  
  return {
    name,
    firstName,
    lastName,
    email,
    phone,
    // Match format from ContactsHelper
    tel: phone ? [phone] : [],
    emailAddresses: email ? [email] : []
  };
}

/**
 * Parse a contact file based on its extension
 * @param {File} file - The file to parse
 * @returns {Promise<Array>} - Array of parsed contacts
 */
export const parseContactFile = (file) => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return parseCSV(file);
  } else if (fileName.endsWith('.vcf')) {
    return parseVCF(file);
  } else {
    return Promise.reject(new Error('Unsupported file format. Please upload a CSV or VCF file.'));
  }
};

export default {
  parseCSV,
  parseVCF,
  parseContactFile
};
