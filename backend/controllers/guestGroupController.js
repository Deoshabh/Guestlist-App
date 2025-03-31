const GuestGroup = require('../models/GuestGroup');
const Guest = require('../models/Guest');

// Get all guest groups for a user
exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await GuestGroup.find({ user: userId }).sort({ createdAt: -1 });
    
    res.json(groups);
  } catch (error) {
    console.error('Error fetching guest groups:', error);
    res.status(500).json({ error: 'Failed to fetch guest groups' });
  }
};

// Create a new guest group
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    const newGroup = new GuestGroup({
      name,
      user: userId
    });
    
    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    console.error('Error creating guest group:', error);
    res.status(500).json({ error: 'Failed to create guest group' });
  }
};

// Update a guest group
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    const group = await GuestGroup.findOne({ _id: id, user: userId });
    
    if (!group) {
      return res.status(404).json({ error: 'Guest group not found' });
    }
    
    group.name = name;
    const updatedGroup = await group.save();
    
    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating guest group:', error);
    res.status(500).json({ error: 'Failed to update guest group' });
  }
};

// Delete a guest group
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const group = await GuestGroup.findOne({ _id: id, user: userId });
    
    if (!group) {
      return res.status(404).json({ error: 'Guest group not found' });
    }
    
    // Find default group or create one
    let defaultGroup = await GuestGroup.findOne({ 
      name: 'Default', 
      user: userId 
    });
    
    if (!defaultGroup) {
      defaultGroup = new GuestGroup({
        name: 'Default',
        user: userId
      });
      await defaultGroup.save();
    }
    
    // Move all guests from deleted group to default group
    await Guest.updateMany(
      { groupId: id, user: userId },
      { $set: { groupId: defaultGroup._id } }
    );
    
    // Delete the group
    await GuestGroup.deleteOne({ _id: id, user: userId });
    
    res.json({ message: 'Guest group deleted successfully' });
  } catch (error) {
    console.error('Error deleting guest group:', error);
    res.status(500).json({ error: 'Failed to delete guest group' });
  }
};
