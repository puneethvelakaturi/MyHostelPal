const express = require('express');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const aiService = require('../services/aiService');

const { generateDailyReport, getUserStats } = require('../services/reportService');

const router = express.Router();

// Get daily report
router.get('/daily', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        const report = await generateDailyReport();
        res.json(report);
    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({ message: 'Error generating daily report' });
    }
});

// Get user statistics
router.get('/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        const stats = await getUserStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Error fetching user statistics' });
    }
});

// Get weekly report
router.get('/weekly', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Get date range for the past week
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        // Get tickets for the past week
        const tickets = await Ticket.find({
            createdAt: { $gte: lastWeek, $lt: today }
    }).populate('student', 'name');

        // Get daily ticket counts
        const dailyCounts = await Ticket.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastWeek, $lt: today }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Get tickets by category
        const categoryStats = await Ticket.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastWeek, $lt: today }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get resolution metrics
        const resolutionStats = await Ticket.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastWeek, $lt: today },
                    status: 'closed'
                }
            },
            {
                $group: {
                    _id: null,
                    avgResolutionTime: {
                        $avg: {
                            $subtract: ['$updatedAt', '$createdAt']
                        }
                    },
                    totalResolved: { $sum: 1 }
                }
            }
        ]);

        // Count priority distribution
        const priorityStats = await Ticket.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastWeek, $lt: today }
                }
            },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Generate AI analysis
        let aiAnalysis = null;
        if (tickets.length > 0) {
            try {
                aiAnalysis = await aiService.generateWeeklyReport(tickets);
                aiAnalysis = typeof aiAnalysis === 'string' ? aiAnalysis : JSON.stringify(aiAnalysis);
            } catch (error) {
                console.error('Error generating AI analysis:', error);
                aiAnalysis = 'AI analysis currently unavailable';
            }
        }

        res.json({
            totalTickets: tickets.length,
            dailyDistribution: dailyCounts,
            categoryBreakdown: categoryStats,
            priorityDistribution: priorityStats,
            resolutionMetrics: resolutionStats[0] || { avgResolutionTime: null, totalResolved: 0 },
            tickets,
            aiAnalysis
        });
    } catch (error) {
        console.error('Error generating weekly report:', error);
        res.status(500).json({ message: 'Error generating weekly report' });
    }
});

// Get monthly report
router.get('/monthly', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Get date range for the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Get tickets for the month
        const tickets = await Ticket.find({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('student', 'name');

        // Get weekly distribution
        const weeklyDistribution = await Ticket.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: { $week: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Get category distribution
        const categoryStats = await Ticket.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get resolution metrics
        const resolutionStats = await Ticket.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: 'closed'
                }
            },
            {
                $group: {
                    _id: null,
                    avgResolutionTime: {
                        $avg: {
                            $subtract: ['$updatedAt', '$createdAt']
                        }
                    },
                    totalResolved: { $sum: 1 }
                }
            }
        ]);

        // Get status distribution
        const statusStats = await Ticket.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Generate AI analysis
        let aiAnalysis = null;
        if (tickets.length > 0) {
            try {
                aiAnalysis = await aiService.generateMonthlyReport(tickets);
                aiAnalysis = typeof aiAnalysis === 'string' ? aiAnalysis : JSON.stringify(aiAnalysis);
            } catch (error) {
                console.error('Error generating AI analysis:', error);
                aiAnalysis = 'AI analysis currently unavailable';
            }
        }

        res.json({
            totalTickets: tickets.length,
            weeklyDistribution,
            categoryBreakdown: categoryStats,
            statusDistribution: statusStats,
            resolutionMetrics: resolutionStats[0] || { avgResolutionTime: null, totalResolved: 0 },
            tickets,
            aiAnalysis
        });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ message: 'Error generating monthly report' });
    }
});

module.exports = router;