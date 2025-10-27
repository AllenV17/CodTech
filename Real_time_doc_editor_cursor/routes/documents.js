const express = require('express');
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');

const router = express.Router();

// Get all documents for user
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { owner: req.user.userId },
        { 'collaborators.user': req.user.userId },
        { isPublic: true }
      ]
    })
    .populate('owner', 'username')
    .populate('collaborators.user', 'username')
    .sort({ lastModified: -1 });

    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public documents
router.get('/public', async (req, res) => {
  try {
    const documents = await Document.find({ isPublic: true })
      .populate('owner', 'username')
      .populate('collaborators.user', 'username')
      .sort({ lastModified: -1 });

    res.json({ documents });
  } catch (error) {
    console.error('Get public documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'username')
      .populate('collaborators.user', 'username');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access
    const hasAccess = document.owner._id.toString() === req.user.userId ||
                     document.collaborators.some(collab => 
                       collab.user._id.toString() === req.user.userId
                     ) ||
                     document.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new document
router.post('/', [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, content = '', isPublic = true } = req.body;

    const document = new Document({
      title,
      content,
      owner: req.user.userId,
      isPublic
    });

    await document.save();
    await document.populate('owner', 'username');

    res.status(201).json({
      message: 'Document created successfully',
      document
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update document
router.put('/:id', async (req, res) => {
  try {
    const { title, content, isPublic } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is owner or has write permission
    const isOwner = document.owner.toString() === req.user.userId;
    const hasWritePermission = document.collaborators.some(collab => 
      collab.user.toString() === req.user.userId && collab.permissions === 'write'
    );

    if (!isOwner && !hasWritePermission) {
      return res.status(403).json({ message: 'No write permission' });
    }

    // Update fields
    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;
    if (isPublic !== undefined) document.isPublic = isPublic;
    
    document.version += 1;
    await document.save();

    res.json({
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can delete
    if (document.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only owner can delete document' });
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add collaborator
router.post('/:id/collaborators', [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('permissions')
    .isIn(['read', 'write'])
    .withMessage('Permissions must be read or write')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, permissions } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can add collaborators
    if (document.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only owner can add collaborators' });
    }

    // Prevent adding yourself as a collaborator
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot add yourself as a collaborator' });
    }

    // Check if user is already a collaborator
    const existingCollaborator = document.collaborators.find(
      collab => collab.user.toString() === userId
    );

    if (existingCollaborator) {
      existingCollaborator.permissions = permissions;
    } else {
      document.collaborators.push({ user: userId, permissions });
    }

    await document.save();
    await document.populate('collaborators.user', 'username');

    res.json({
      message: 'Collaborator added successfully',
      document
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
