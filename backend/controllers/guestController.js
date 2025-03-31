const Guest = require('../models/Guest');
const GuestGroup = require('../models/GuestGroup');

// Update the createGuest and updateGuest functions to handle group ID

exports.createGuest = async (req, res) => {
  try {
    const { name, contact, email, phone, invited, groupId } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Validate that the groupId belongs to the user if provided
    if (groupId) {
      const group = await GuestGroup.findOne({ _id: groupId, user: userId });
      if (!group) {
        return res.status(404).json({ error: 'Guest group not found' });
      }
    }
    
    const newGuest = new Guest({
      name,
      contact: contact || '',
      email: email || '',  // Store the email field
      phone: phone || '',  // Store the phone field
      invited: invited || false,
      user: userId,
      groupId: groupId || null
    });
    
    const savedGuest = await newGuest.save();
    res.status(201).json(savedGuest);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Guest with this name and contact already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateGuest = async (req, res) => {
  try {
    const { name, contact, email, phone, invited, groupId } = req.body;
    const userId = req.user.id;
    
    // Validate that the groupId belongs to the user if provided
    if (groupId) {
      const group = await GuestGroup.findOne({ _id: groupId, user: userId });
      if (!group) {
        return res.status(404).json({ error: 'Guest group not found' });
      }
    }
    
    // Find the guest by ID and user
    const guest = await Guest.findOne({ 
      _id: req.params.id, 
      user: userId,
      deleted: false
    });
    
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    // Update guest fields if provided
    if (name) guest.name = name;
    if (contact !== undefined) guest.contact = contact;
    if (email !== undefined) guest.email = email;  // Update email field
    if (phone !== undefined) guest.phone = phone;  // Update phone field
    if (invited !== undefined) guest.invited = invited;
    if (groupId !== undefined) guest.groupId = groupId;
    
    const updatedGuest = await guest.save();
    res.json(updatedGuest);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Guest with this name and contact already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update getGuests to include group information
exports.getGuests = async (req, res) => {
  try {
    const guests = await Guest.find({ 
      user: req.user.id,
      deleted: false 
    }).populate('groupId', 'name');
    
    res.json(guests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add an endpoint to get guests by group
exports.getGuestsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Verify the group exists and belongs to this user
    const group = await GuestGroup.findOne({ _id: groupId, user: userId });
    if (!group) {
      return res.status(404).json({ error: 'Guest group not found' });
    }
    
    // Find all guests in this group
    const guests = await Guest.find({ 
      user: userId,
      groupId,
      deleted: false 
    });
    
    res.json(guests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add an endpoint to update guest groups in bulk
exports.updateGuestsGroup = async (req, res) => {
  try {
    const { ids, groupId } = req.body;
    const userId = req.user.id;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No guest IDs provided' });
    }
    
    // Verify the group exists and belongs to this user if provided
    if (groupId) {
      const group = await GuestGroup.findOne({ _id: groupId, user: userId });
      if (!group) {
        return res.status(404).json({ error: 'Guest group not found' });
      }
    }
    
    // Update all guests
    const result = await Guest.updateMany(
      { _id: { $in: ids }, user: userId },
      { $set: { groupId: groupId || null } }
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
};

// Add the exportGuestsCSV controller function
exports.exportGuestsCSV = async (req, res) => {
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
    const { Parser } = require('json2csv');
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
};

// Make sure the bulkUpdateGuests function exists
exports.bulkUpdateGuests = async (req, res) => {
  try {
    const { ids, invited } = req.body;
    const userId = req.user.id;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No guest IDs provided' });
    }
    
    // Update all guests
    const result = await Guest.updateMany(
      { _id: { $in: ids }, user: userId },
      { $set: { invited: invited } }
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
};

// Add missing getGuestById implementation
exports.getGuestById = async (req, res) => {
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
};

// Add missing getGuestStats implementation
exports.getGuestStats = async (req, res) => {
  try {
    const total = await Guest.countDocuments({ user: req.user.id, deleted: false });
    const invited = await Guest.countDocuments({ user: req.user.id, invited: true, deleted: false });
    const pending = total - invited;
    res.json({ total, invited, pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add missing importGuestsCSV implementation
exports.importGuestsCSV = async (req, res) => {
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
    const csv = require('fast-csv');
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
};

// Add delete and undelete functionality
exports.deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findOne({ 
      _id: req.params.id, 
      user: req.user.id,
      deleted: false
    });
    
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    guest.deleted = true;
    await guest.save();
    
    res.json({ success: true, message: 'Guest deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.undoDeleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findOne({ 
      _id: req.params.id, 
      user: req.user.id,
      deleted: true
    });
    
    if (!guest) {
      return res.status(404).json({ error: 'Deleted guest not found' });
    }
    
    guest.deleted = false;
    await guest.save();
    
    res.json({ success: true, message: 'Guest restored successfully', guest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
