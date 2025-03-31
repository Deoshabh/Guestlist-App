const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

// Protect all template routes with auth middleware
router.use(authMiddleware);

// Get all templates
router.get('/', templateController.getTemplates);

// Get a single template
router.get('/:id', templateController.getTemplateById);

// Create a new template
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Template name is required'),
    body('content').notEmpty().withMessage('Template content is required'),
    validateRequest
  ],
  templateController.createTemplate
);

// Update a template
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Template name cannot be empty'),
    body('content').optional().notEmpty().withMessage('Template content cannot be empty'),
    validateRequest
  ],
  templateController.updateTemplate
);

// Delete a template
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;
