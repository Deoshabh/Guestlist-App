const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');
const csv = require('fast-csv');
const { Parser } = require('json2csv');

// GET /api/guests - list guests with search and sort options
router.get('/', async (req, res) => {
  try {
    const { search, sortField, sortOrder } = req.query;
    let query = { deleted: false };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }
    let sort = {};
    if (sortField && sortOrder) {
      sort[sortField] = sortOrder === 'asc' ? 1 : -1;
    }
    const guests = await Guest.find(query).sort(sort);
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guests - add a new guest with duplicate check
router.post('/', async (req, res) => {
  try {
    const { name, contact } = req.body;
    // Check for duplicate guest (only non-deleted records)
    const existing = await Guest.findOne({ name, contact, deleted: false });
    if (existing) {
      return res.status(400).json({ error: 'Guest already exists' });
    }
    const guest = new Guest({ name, contact });
    await guest.save();
    res.json(guest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/guests/:id - update guest (e.g. toggle invited status)
router.put('/:id', async (req, res) => {
  try {
    const { name, contact, invited } = req.body;
    
    // If this is a name/contact update (not just an invited status toggle)
    if (name !== undefined) {
      // Validate name is not empty
      if (!name.trim()) {
        return res.status(400).json({ error: 'Guest name cannot be empty' });
      }
      
      // Check for duplicates (exclude current guest from check)
      const duplicate = await Guest.findOne({
        _id: { $ne: req.params.id },
        name: name.trim(),
        contact: contact ? contact.trim() : '',
        deleted: false
      });
      
      if (duplicate) {
        return res.status(400).json({ error: 'Another guest with the same name and contact already exists' });
      }
    }
    
    const guest = await Guest.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    res.json(guest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/guests/:id - soft delete guest
router.delete('/:id', async (req, res) => {
  try {
    const guest = await Guest.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    res.json({ message: 'Guest deleted', guest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/guests/:id/undo - undo delete (restore guest)
router.put('/:id/undo', async (req, res) => {
  try {
    const guest = await Guest.findByIdAndUpdate(req.params.id, { deleted: false }, { new: true });
    res.json({ message: 'Guest restored', guest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/guests/bulk-update - bulk update invited status
router.put('/bulk-update', async (req, res) => {
  try {
    const { ids, invited } = req.body;
    await Guest.updateMany({ _id: { $in: ids } }, { invited });
    res.json({ message: 'Bulk update successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/guests/export - export guests as CSV
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.id; // Make sure to get the user ID from the auth middleware
    
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
router.post('/import', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const file = req.files.file;
    let importedGuests = [];
    let errorRows = [];
    
    // Use CSV options to not auto-detect headers
    const csvOptions = {
      headers: false, // We'll manually detect headers if present
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
            const exists = await Guest.findOne({ name, contact, deleted: false });
            if (!exists) {
              let guest = new Guest({ name, contact });
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

// GET /api/guests/stats - retrieve guest count & statistics
router.get('/stats', async (req, res) => {
  try {
    const total = await Guest.countDocuments({ deleted: false });
    const invited = await Guest.countDocuments({ invited: true, deleted: false });
    const pending = total - invited;
    res.json({ total, invited, pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
