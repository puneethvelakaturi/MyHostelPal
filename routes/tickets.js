const express = require('express');
const multer = require('multer');
// const cloudinary = require('cloudinary').v2; // Not needed for demo
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const { auth, studentAuth, adminAuth } = require('../middleware/auth');
const aiService = require('../services/aiService');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Cloudinary configuration skipped for demo

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create new ticket
router.post('/', auth, studentAuth, upload.array('images', 5), [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('location.roomNumber').optional().trim(),
  body('location.block').optional().trim(),
  body('location.specificLocation').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, location } = req.body;

  // Use AI to categorize and prioritize the complaint (pass title + description)
  const aiAnalysis = await aiService.categorizeComplaint(title, description);
  const priorityAnalysis = await aiService.predictPriority(title, description, aiAnalysis.category);
  const suggestions = await aiService.generateSuggestions(description, aiAnalysis.category, priorityAnalysis.priority);

    // Mock image handling for demo (no Cloudinary needed)
    const images = [];
    if (req.files) {
      for (const file of req.files) {
        images.push({ 
          url: `mock-image-${Date.now()}-${Math.random()}.jpg`, 
          publicId: `mock-${Date.now()}` 
        });
      }
    }

    // Create ticket
    const ticket = new Ticket({
      title,
      description,
      category: aiAnalysis.category,
      priority: priorityAnalysis.priority,
      student: req.user.userId,
      location: {
        roomNumber: location?.roomNumber || req.user.user.roomNumber,
        block: location?.block || req.user.user.hostelBlock,
        specificLocation: location?.specificLocation
      },
      images,
      aiAnalysis: {
        categoryConfidence: aiAnalysis.confidence,
        priorityConfidence: priorityAnalysis.confidence,
        extractedKeywords: aiAnalysis.keywords,
        suggestedActions: suggestions
      }
    });

    await ticket.save();

    // Send notifications for high priority tickets
    if (priorityAnalysis.priority === 'urgent' || priorityAnalysis.priority === 'high') {
      await notificationService.sendEscalationNotification(ticket);
    }

    // Create notification for student
    await notificationService.createNotification({
      user: req.user.userId,
      ticket: ticket._id,
      title: 'Ticket Created',
      message: `Your ${aiAnalysis.category} request has been submitted successfully.`,
      type: 'ticket_created',
      priority: priorityAnalysis.priority
    });

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: await ticket.populate('student', 'name email roomNumber')
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Server error creating ticket' });
  }
});

// Get user's tickets
router.get('/my-tickets', auth, async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;
    const filter = { student: req.user.userId };
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const tickets = await Ticket.find(filter)
      .populate('student', 'name email roomNumber')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Server error fetching tickets' });
  }
});

// Get single ticket
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('student', 'name email roomNumber phoneNumber')
      .populate('assignedTo', 'name email phoneNumber')
      .populate('resolution.resolvedBy', 'name email')
      .populate('comments.user', 'name role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to this ticket
    if (req.user.role === 'student' && ticket.student._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error fetching ticket' });
  }
});

// Add comment to ticket
router.post('/:id/comments', auth, [
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check access
    if (req.user.role === 'student' && ticket.student.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    ticket.comments.push({
      user: req.user.userId,
      message
    });

    await ticket.save();

    // Create notification for other participants
    const notificationTitle = req.user.role === 'student' ? 'Student Comment' : 'Staff Response';
    await notificationService.createNotification({
      user: ticket.student,
      ticket: ticket._id,
      title: notificationTitle,
      message: `New comment on ticket: ${ticket.title}`,
      type: 'ticket_updated',
      priority: ticket.priority
    });

    res.json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// Update ticket status (Admin/Staff only)
router.put('/:id/status', auth, adminAuth, [
  body('status').isIn(['open', 'in_progress', 'resolved', 'closed', 'cancelled']).withMessage('Invalid status'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, assignedTo, resolutionDescription } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;

    if (assignedTo) {
      ticket.assignedTo = assignedTo;
    }

    if (status === 'resolved' && resolutionDescription) {
      ticket.resolution = {
        description: resolutionDescription,
        resolvedBy: req.user.userId,
        resolvedAt: new Date()
      };
      ticket.actualResolutionTime = new Date();
    }

    await ticket.save();

    // Create notification for student
    await notificationService.createNotification({
      user: ticket.student,
      ticket: ticket._id,
      title: 'Ticket Status Updated',
      message: `Your ticket status has been changed to ${status}`,
      type: 'ticket_updated',
      priority: ticket.priority
    });

    res.json({ message: 'Ticket status updated successfully' });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ message: 'Server error updating ticket status' });
  }
});

// Get all tickets (Admin/Staff only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { status, category, priority, assignedTo, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tickets = await Ticket.find(filter)
      .populate('student', 'name email roomNumber phoneNumber')
      .populate('assignedTo', 'name email')
      .sort({ priority: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ message: 'Server error fetching tickets' });
  }
});

module.exports = router;
