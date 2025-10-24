const admin = require('firebase-admin');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.initializeFirebase();
    this.initializeTwilio();
    this.initializeEmail();
  }

  initializeFirebase() {
    // Skip Firebase initialization for demo
    console.log('Firebase initialization skipped for demo');
  }

  initializeTwilio() {
    // Skip Twilio initialization for demo
    console.log('Twilio initialization skipped for demo');
  }

  initializeEmail() {
    // Skip email initialization for demo
    console.log('Email initialization skipped for demo');
  }

  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Send push notification if user has FCM token
      const user = await User.findById(notificationData.user);
      if (user && user.fcmToken) {
        await this.sendPushNotification(user.fcmToken, notificationData.title, notificationData.message);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async sendPushNotification(fcmToken, title, message) {
    try {
      // Mock implementation - just log for demo
      console.log(`Push Notification: ${title} - ${message}`);
      console.log(`FCM Token: ${fcmToken}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async sendSMS(phoneNumber, message) {
    try {
      // Mock implementation - just log for demo
      console.log(`SMS to ${phoneNumber}: ${message}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  }

  async sendEmail(email, subject, message) {
    try {
      // Mock implementation - just log for demo
      console.log(`Email to ${email}: ${subject} - ${message}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendEscalationNotification(ticket) {
    try {
      // Get admin users
      const admins = await User.find({ 
        role: { $in: ['admin', 'staff'] },
        isActive: true 
      });

      const escalationMessage = `URGENT: High priority ticket #${ticket._id} - ${ticket.title}`;

      // Send notifications to all admins
      for (const admin of admins) {
        // Create notification record
        await this.createNotification({
          user: admin._id,
          ticket: ticket._id,
          title: 'High Priority Ticket',
          message: escalationMessage,
          type: 'escalation',
          priority: 'urgent'
        });

        // Send push notification
        if (admin.fcmToken) {
          await this.sendPushNotification(admin.fcmToken, 'High Priority Ticket', escalationMessage);
        }

        // Send SMS for urgent tickets
        if (ticket.priority === 'urgent' && admin.phoneNumber) {
          await this.sendSMS(admin.phoneNumber, escalationMessage);
        }

        // Send email
        if (admin.email) {
          await this.sendEmail(admin.email, 'High Priority Ticket Alert', escalationMessage);
        }
      }
    } catch (error) {
      console.error('Error sending escalation notification:', error);
    }
  }

  async sendTicketUpdateNotification(ticket, updateType) {
    try {
      const student = await User.findById(ticket.student);
      if (!student) return;

      let title, message;
      
      switch (updateType) {
        case 'assigned':
          title = 'Ticket Assigned';
          message = `Your ticket "${ticket.title}" has been assigned to a staff member.`;
          break;
        case 'in_progress':
          title = 'Ticket In Progress';
          message = `Your ticket "${ticket.title}" is now being worked on.`;
          break;
        case 'resolved':
          title = 'Ticket Resolved';
          message = `Your ticket "${ticket.title}" has been resolved.`;
          break;
        case 'closed':
          title = 'Ticket Closed';
          message = `Your ticket "${ticket.title}" has been closed.`;
          break;
        default:
          title = 'Ticket Updated';
          message = `Your ticket "${ticket.title}" has been updated.`;
      }

      // Create notification
      await this.createNotification({
        user: ticket.student,
        ticket: ticket._id,
        title,
        message,
        type: 'ticket_updated',
        priority: ticket.priority
      });

      // Send push notification
      if (student.fcmToken) {
        await this.sendPushNotification(student.fcmToken, title, message);
      }

      // Send email for important updates
      if (['resolved', 'closed'].includes(updateType) && student.email) {
        await this.sendEmail(student.email, title, message);
      }
    } catch (error) {
      console.error('Error sending ticket update notification:', error);
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
