const express = require('express');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, adminAuth } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user role
router.patch('/users/:userId/role', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['student', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Deactivate user
router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(userId, { active: false });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Error deactivating user' });
  }
});

// Get dashboard statistics
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 7;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    // Get ticket statistics
    const totalTickets = await Ticket.countDocuments({
      createdAt: { $gte: startDate }
    });

    const ticketsByStatus = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const ticketsByCategory = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const ticketsByPriority = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get overdue tickets
    const overdueTickets = await Ticket.find({
      status: { $nin: ['resolved', 'closed'] },
      createdAt: { $gte: startDate }
    }).populate('student', 'name roomNumber');

    const overdueCount = overdueTickets.filter(ticket => ticket.isOverdue()).length;

    // Get recent tickets
    const recentTickets = await Ticket.find({ createdAt: { $gte: startDate } })
      .populate('student', 'name roomNumber')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate average resolution time
    const resolvedTickets = await Ticket.find({
      status: 'resolved',
      'resolution.resolvedAt': { $exists: true },
      createdAt: { $gte: startDate }
    });

    const avgResolutionTime = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, ticket) => {
          const resolutionTime = ticket.resolution.resolvedAt - ticket.createdAt;
          return sum + resolutionTime;
        }, 0) / resolvedTickets.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    res.json({
      period,
      totalTickets,
      ticketsByStatus: ticketsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      ticketsByCategory: ticketsByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      ticketsByPriority: ticketsByPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      overdueCount,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
      recentTickets
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// Get AI-generated daily report
router.get('/reports/daily', auth, adminAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const tickets = await Ticket.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('student', 'name roomNumber');

    const report = await aiService.generateDailyReport(tickets);

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      report,
      ticketCount: tickets.length
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ message: 'Server error generating daily report' });
  }
});

// Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Update user status
router.put('/users/:id/status', auth, adminAuth, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User status updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// Get ticket analytics
router.get('/analytics', auth, adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    // Daily ticket creation trend
    const dailyTrend = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Resolution time by category
    const resolutionTimeByCategory = await Ticket.aggregate([
      {
        $match: {
          status: 'resolved',
          'resolution.resolvedAt': { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          avgResolutionTime: {
            $avg: {
              $subtract: ['$resolution.resolvedAt', '$createdAt']
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top issues by category
    const topIssues = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      period,
      dailyTrend,
      resolutionTimeByCategory: resolutionTimeByCategory.map(item => ({
        category: item._id,
        avgResolutionTime: Math.round(item.avgResolutionTime / (1000 * 60 * 60) * 100) / 100, // Convert to hours
        count: item.count
      })),
      topIssues
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// Get notifications
router.get('/notifications', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const filter = {};
    
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate('user', 'name email')
      .populate('ticket', 'title status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

module.exports = router;
