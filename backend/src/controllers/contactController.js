const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const vCardParser = require('vcf');
const Guest = require('../models/Guest');
const config = require('../config');

// Import contacts from VCF file
exports.importContactsFromVcf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a VCF file'
      });
    }
    
    // Read the VCF file
    const vcfContent = fs.readFileSync(req.file.path, 'utf8');
    
    // Parse the VCF content
    const cards = vCardParser.parse(vcfContent);
    
    // Extract contact information
    const contacts = cards.map(card => {
      const name = card.get('fn')?.valueOf() || 'Unknown';
      const tel = card.get('tel');
      const email = card.get('email');
      
      return {
        name,
        phone: tel ? tel.valueOf().toString().replace(/[^0-9]/g, '') : '',
        email: email ? email.valueOf() : '',
        importedFrom: 'vcf'
      };
    }).filter(contact => contact.phone); // Only include contacts with phone numbers
    
    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    
    if (contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid contacts found in the VCF file'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Successfully imported ${contacts.length} contacts`,
      contacts
    });
  } catch (error) {
    console.error('VCF import error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error importing contacts'
    });
  }
};

// Start Google OAuth process
exports.startGoogleContactsImport = async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
    
    const scopes = [
      'https://www.googleapis.com/auth/contacts.readonly'
    ];
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
    
    res.status(200).json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Google OAuth start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start Google authentication'
    });
  }
};

// Handle Google OAuth callback and import contacts
exports.handleGoogleContactsCallback = async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code is required'
    });
  }
  
  try {
    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get people service
    const people = google.people({
      version: 'v1',
      auth: oauth2Client
    });
    
    // Get contacts
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      personFields: 'names,phoneNumbers,emailAddresses',
      pageSize: 1000
    });
    
    const connections = response.data.connections || [];
    
    // Format contacts
    const contacts = connections.map(person => {
      const name = person.names ? person.names[0].displayName : 'Unknown';
      const phones = person.phoneNumbers || [];
      const emails = person.emailAddresses || [];
      
      return {
        name,
        phone: phones.length > 0 ? phones[0].value.replace(/[^0-9]/g, '') : '',
        email: emails.length > 0 ? emails[0].value : '',
        importedFrom: 'google'
      };
    }).filter(contact => contact.phone); // Only include contacts with phone numbers
    
    res.status(200).json({
      success: true,
      message: `Successfully imported ${contacts.length} contacts from Google`,
      contacts
    });
  } catch (error) {
    console.error('Google contacts import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import Google contacts'
    });
  }
};

// Match guests with contacts by phone number
exports.matchGuestsWithContacts = async (req, res) => {
  try {
    const { contacts } = req.body;
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contacts array is required'
      });
    }
    
    // Get all guests for this user
    const userGuests = await Guest.find({ createdBy: req.user.id });
    
    // Prepare phone numbers for matching
    const phoneMap = {};
    userGuests.forEach(guest => {
      // Normalize phone number by removing non-digits
      const phone = guest.phone.replace(/[^0-9]/g, '');
      phoneMap[phone] = guest;
    });
    
    // Find matches
    const matches = [];
    const newContacts = [];
    
    contacts.forEach(contact => {
      // Normalize contact phone
      const phone = contact.phone.replace(/[^0-9]/g, '');
      
      if (phoneMap[phone]) {
        // This is a match
        matches.push({
          contact,
          guest: phoneMap[phone]
        });
      } else {
        // This is a new contact
        newContacts.push(contact);
      }
    });
    
    res.status(200).json({
      success: true,
      matches,
      newContacts,
      matchCount: matches.length,
      newCount: newContacts.length
    });
  } catch (error) {
    console.error('Contact matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error matching contacts with guests'
    });
  }
};

// Update guest from contact
exports.updateGuestFromContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    
    // Find and update guest
    const guest = await Guest.findOneAndUpdate(
      { 
        _id: id,
        createdBy: req.user.id
      },
      { 
        name,
        email,
        phone,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Guest updated from contact successfully',
      guest
    });
  } catch (error) {
    console.error('Update guest from contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating guest from contact'
    });
  }
};
