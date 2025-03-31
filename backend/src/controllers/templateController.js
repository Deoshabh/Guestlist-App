const Template = require('../models/Template');

// Get all templates for current user
exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving templates'
    });
  }
};

// Get a single template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await Template.findOne({ 
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving template'
    });
  }
};

// Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const { name, content, description } = req.body;
    
    const template = new Template({
      name,
      content,
      description,
      createdBy: req.user.id
    });
    
    await template.save();
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating template'
    });
  }
};

// Update a template
exports.updateTemplate = async (req, res) => {
  try {
    const { name, content, description } = req.body;
    
    // Find and update template
    const template = await Template.findOneAndUpdate(
      { 
        _id: req.params.id,
        createdBy: req.user.id
      },
      { 
        name,
        content,
        description,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating template'
    });
  }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting template'
    });
  }
};
