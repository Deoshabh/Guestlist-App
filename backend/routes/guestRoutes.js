const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');
// const GuestGroup = require('../models/GuestGroup'); // Commented out as it's not being used
const csv = require('fast-csv');
const { Parser } = require('json2csv');
const guestController = require('../controllers/guestController');

// Use controller for standard operations
router.get('/', guestController.getGuests);
router.get('/:id', guestController.getGuestById ? guestController.getGuestById : async (req, res) => {
  try {
    const guest = await Guest.findOne({ 
      _id: req.params.id, 
      user: req.user.id,
      deleted: false 
    }).populate('groupId', 'name');
    
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    res.json(guest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/', guestController.createGuest);
router.put('/:id', guestController.updateGuest);
router.delete('/:id', guestController.deleteGuest);
router.put('/:id/undo', guestController.undoDeleteGuest);
router.get('/group/:groupId', guestController.getGuestsByGroup);
router.put('/bulk-update-group', guestController.updateGuestsGroup);

// GET /api/guests/stats - retrieve guest count & statistics
router.get('/stats', guestController.getGuestStats ? guestController.getGuestStats : async (req, res) => {
  try {
    const total = await Guest.countDocuments({ user: req.user.id, deleted: false });
    const invited = await Guest.countDocuments({ user: req.user.id, invited: true, deleted: false });
    const pending = total - invited;
    res.json({ total, invited, pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/guests/bulk-update - bulk update invited status
router.put('/bulk-update', guestController.bulkUpdateGuests ? guestController.bulkUpdateGuests : async (req, res) => {
  try {
    const { ids, invited } = req.body;
    const userId = req.user.id;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No guest IDs provided' });
    }
    
    // Update all guests
    const result = await Guest.updateMany(
      { _id: { $in: ids }, user: userId },
      { $set: { invited } }
    );
    
    // Get the updated guests
    const updatedGuests = await Guest.find({ _id: { $in: ids }, user: userId });
    
    res.json({
      success: true,
      message: `${result.modifiedCount} guests updated`,
      updatedGuests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/guests/export - export guests as CSV
router.get('/export', guestController.exportGuestsCSV ? guestController.exportGuestsCSV : async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all non-deleted guests belonging to this user
    const guests = await Guest.find({ 
      user: userId,
      deleted: false 
    }).populate('groupId', 'name');
    
    // Prepare data for CSV export
    const guestsForExport = guests.map(guest => ({
      name: guest.name,
      contact: guest.contact || '',
      email: guest.email || '',
      phone: guest.phone || '',
      invited: guest.invited ? 'Yes' : 'No',
      group: guest.groupId ? guest.groupId.name : 'No Group'
    }));
    
    // Define CSV fields
    const fields = ['name', 'contact', 'email', 'phone', 'invited', 'group'];
    
    // Create the CSV parser
    const json2csvParser = new Parser({ fields });
    const csvData = json2csvParser.parse(guestsForExport);
    
    // Set headers for file download
    res.header('Content-Type', 'text/csv');
    res.attachment('guests.csv');
    return res.send(csvData);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'Failed to export guests: ' + err.message });
  }
});

// POST /api/guests/import - import guests from a CSV file
router.post('/import', guestController.importGuestsCSV ? guestController.importGuestsCSV : async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const file = req.files.file;
    let importedGuests = [];
    let errorRows = [];
    const userId = req.user.id;
    
    // Use CSV options to not auto-detect headers
    const csvOptions = {
      headers: false,
      renameHeaders: false
    };
    
    let rows = [];
    await new Promise((resolve, reject) => {
      csv.parseString(file.data.toString('utf8'), csvOptions)
        .on('error', error => reject(error))
        .on('data', row => rows.push(row))
        .on('end', () => resolve());
    });
    
    if (rows.length > 0) {
      // Check if first row is header row by looking for "name" (case-insensitive)
      const headers = rows[0];
      const isFirstRowHeaders = typeof headers[0] === 'string' &&
                                (headers[0].toLowerCase() === 'name' ||
                                 headers[0].toLowerCase().includes('name'));
      
      const dataRows = isFirstRowHeaders ? rows.slice(1) : rows;
      
      for (const row of dataRows) {
        try {
          // Skip if row is empty or first column is empty
          if (!row || row.length === 0 || !row[0]) continue;
          
          // Extract name and contact (contact is optional)
          const name = row[0]?.trim();
          const contact = row[1] ? row[1].trim() : '';
          
          if (name) {
            // Check for duplicate guest
            const exists = await Guest.findOne({ 
              name, 
              contact, 
              deleted: false,
              user: userId
            });
            if (!exists) {
              let guest = new Guest({ 
                name, 
                contact,
                user: userId
              });
              await guest.save();
              importedGuests.push(guest);
            }
          }
        } catch (err) {
          errorRows.push({ row, error: err.message });
        }
      }
      
      return res.json({ 
        message: 'Import complete', 
        importedCount: importedGuests.length,
        errors: errorRows.length > 0 ? errorRows : undefined
      });
    } else {
      return res.status(400).json({ error: 'No data found in the CSV file' });
    }
  } catch (err) {
    console.error('CSV Import Error:', err);
    res.status(500).json({ 
      error: 'Error importing guests',
      details: err.message
    });
  }
});

module.exports = router;
