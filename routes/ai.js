const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Analyze complaint text
router.post('/analyze', auth, [
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('title').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

  const { title = '', description } = req.body;

  // Get AI analysis (pass title + description)
  const categoryAnalysis = await aiService.categorizeComplaint(title, description);
  const priorityAnalysis = await aiService.predictPriority(title, description, categoryAnalysis.category);
  const suggestions = await aiService.generateSuggestions(description, categoryAnalysis.category, priorityAnalysis.priority);

    res.json({
      category: categoryAnalysis.category,
      categoryConfidence: categoryAnalysis.confidence,
      priority: priorityAnalysis.priority,
      priorityConfidence: priorityAnalysis.confidence,
      keywords: categoryAnalysis.keywords,
      suggestions,
      reasoning: priorityAnalysis.reasoning
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ message: 'Server error analyzing complaint' });
  }
});

// Generate report for specific date range
router.post('/generate-report', auth, [
  body('startDate').isISO8601().withMessage('Start date must be valid ISO date'),
  body('endDate').isISO8601().withMessage('End date must be valid ISO date'),
  body('reportType').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid report type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, reportType } = req.body;

    // This would typically fetch tickets from database
    // For now, returning a placeholder response
    res.json({
      message: 'Report generation feature coming soon',
      reportType,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error generating report' });
  }
});

module.exports = router;
