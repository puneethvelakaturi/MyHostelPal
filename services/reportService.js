const Ticket = require('../models/Ticket');
const User = require('../models/User');
const aiService = require('./aiService');

/**
 * Generate a daily report of tickets
 */
async function generateDailyReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tickets = await Ticket.find({
        createdAt: { $gte: today, $lt: tomorrow }
    }).populate('student', 'name');

    // Aggregate tickets by category
    const categoryStats = await Ticket.aggregate([
        {
            $match: {
                createdAt: { $gte: today, $lt: tomorrow }
            }
        },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        }
    ]);

    // Aggregate tickets by status
    const statusStats = await Ticket.aggregate([
        {
            $match: {
                createdAt: { $gte: today, $lt: tomorrow }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // Get user registration stats
    const newUsers = await User.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
    });

    const reportData = {
        date: today,
        totalTickets: tickets.length,
        categoryBreakdown: categoryStats,
        statusBreakdown: statusStats,
        newUsers,
        tickets
    };

    // Generate AI analysis
    const prompt = `Generate a concise analysis of today's hostel maintenance activity:
    - Total tickets: ${tickets.length}
    - Category breakdown: ${JSON.stringify(categoryStats)}
    - Status breakdown: ${JSON.stringify(statusStats)}
    - New users registered: ${newUsers}
    
    Provide insights on:
    1. Most common issues
    2. Resolution efficiency
    3. Any concerning patterns
    4. Recommendations for improvement`;

    try {
        const aiAnalysis = await aiService.generateDailyReport(tickets);
        // Ensure AI analysis is a plain string
        if (typeof aiAnalysis === 'string') {
            reportData.aiAnalysis = aiAnalysis;
        } else if (aiAnalysis && typeof aiAnalysis === 'object') {
            reportData.aiAnalysis = JSON.stringify(aiAnalysis);
        } else {
            reportData.aiAnalysis = String(aiAnalysis);
        }
    } catch (error) {
        console.error('Error generating AI analysis:', error);
        reportData.aiAnalysis = 'AI analysis currently unavailable';
    }

    return reportData;
}

/**
 * Get user statistics
 */
async function getUserStats() {
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const staffCount = await User.countDocuments({ role: 'staff' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    return {
        totalUsers,
        studentCount,
        staffCount,
        adminCount
    };
}

module.exports = {
    generateDailyReport,
    getUserStats
};