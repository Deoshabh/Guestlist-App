const Guest = require('../models/Guest');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const { generateWhatsAppLink } = require('../utils/whatsappHelper');

// Get all guests for current user
exports.getGuests = async (req, res) => {
  try {
    const guests = await Guest.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: guests.length,
      guests
    });
  } catch (error) {
    console.error('Get guests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving guests'
    });
  }
};

// Get a single guest by ID
exports.getGuestById = async (req, res) => {
  try {
    const guest = await Guest.findOne({ 
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }
    
    res.status(200).json({
      success: true,
      guest
    });
  } catch (error) {
    console.error('Get guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving guest'
    });
  }
};

// Create a new guest
exports.createGuest = async (req, res) => {
  try {
    const { name, email, phone, status, notes } = req.body;
    
    const guest = new Guest({
      name,
      email,
      phone,
      status,
      notes,
      createdBy: req.user.id
    });
    
    await guest.save();
    
    res.status(201).json({
      success: true,
      message: 'Guest added successfully',
      guest
    });
  } catch (error) {
    console.error('Create guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating guest'
    });
  }
};

// Create multiple guests at once
exports.createBulkGuests = async (req, res) => {
  try {
    const { guests } = req.body;
    
    if (!guests || !Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No guests provided'
      });
    }
    
    // Add createdBy to each guest
    const guestsWithUser = guests.map(guest => ({
      ...guest,
      createdBy: req.user.id
    }));
    
    // Insert guests into database
    const result = await Guest.insertMany(guestsWithUser);
    
    res.status(201).json({
      success: true,
      message: `Successfully added ${result.length} guests`,
      count: result.length,
      guests: result
    });
  } catch (error) {
    console.error('Bulk create guests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating guests'
    });
  }
};

// Update a guest
exports.updateGuest = async (req, res) => {
  try {
    const { name, email, phone, status, notes } = req.body;
    
    // Find and update guest
    const guest = await Guest.findOneAndUpdate(
      { 
        _id: req.params.id,
        createdBy: req.user.id
      },
      { 
        name,
        email,
        phone,
        status,
        notes,
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
      message: 'Guest updated successfully',
      guest
    });
  } catch (error) {
    console.error('Update guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating guest'
    });
  }
};

// Delete a guest
exports.deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Guest deleted successfully'
    });
  } catch (error) {
    console.error('Delete guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting guest'
    });
  }
};

// Import guests from CSV
exports.importGuestsFromCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }
    
    const guests = [];
    const errors = [];
    let rowCount = 0;
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv.parse({ headers: true, ignoreEmpty: true }))
        .on('data', (row) => {
          rowCount++;
          if (!row.name || !row.phone) {
            errors.push(`Row ${rowCount}: Missing name or phone`);
            return;
          }
          
          guests.push({
            name: row.name,
            email: row.email || '',
            phone: row.phone,
            status: row.status || 'pending',
            notes: row.notes || '',
            importedFrom: 'csv',
            createdBy: req.user.id
          });
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error.message);
          reject(error);
        })
        .on('end', () => {
          resolve();
        });
    });
    
    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'There were errors in the CSV file',
        errors
      });
    }
    
    if (guests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records found in the CSV file'
      });
    }
    
    // Insert guests into database
    await Guest.insertMany(guests);
    
    res.status(201).json({
      success: true,
      message: `Successfully imported ${guests.length} guests`,
      count: guests.length
    });
  } catch (error) {
    console.error('Import guests error:', error);
    
    // Cleanup the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error importing guests'
    });
  }
};

// Generate WhatsApp link for a guest
exports.generateWhatsAppLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { template } = req.body;
    
    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Message template is required'
      });
    }
    
    const guest = await Guest.findOne({ 
      _id: id,
      createdBy: req.user.id
    });
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }
    
    const whatsappLink = generateWhatsAppLink(guest.phone, template, guest.name);
    
    res.status(200).json({
      success: true,
      whatsappLink
    });
  } catch (error) {
    console.error('WhatsApp link generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating WhatsApp link'
    });
  }
};

// Generate WhatsApp links for multiple guests
exports.generateBulkWhatsAppLinks = async (req, res) => {
  try {
    const { guestIds, template, templateId } = req.body;
    
    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Guest IDs array is required'
      });
    }
    
    if (!template && !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Either message template or template ID is required'
      });
    }
    
    // If templateId is provided, fetch the template content
    let messageTemplate = template;
    
    if (templateId) {
      const Template = require('../models/Template');
      const foundTemplate = await Template.findOne({
        _id: templateId,
        createdBy: req.user.id
      });
      
      if (!foundTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      messageTemplate = foundTemplate.content;
    }
    
    const guests = await Guest.find({ 
      _id: { $in: guestIds },
      createdBy: req.user.id
    });
    
    if (!guests.length) {
      return res.status(404).json({
        success: false,
        message: 'No guests found'
      });
    }
    
    const results = guests.map(guest => ({
      id: guest._id,
      name: guest.name,
      phone: guest.phone,
      whatsappLink: generateWhatsAppLink(guest.phone, messageTemplate, guest.name)
    }));
    
    res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Bulk WhatsApp link generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating WhatsApp links'
    });
  }
};
