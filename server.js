const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const WebSocketServer = require('./services/websocketService');
const { apiLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer(server);

// Drop existing unique index on studentId if it exists
mongoose.connection.on('connected', async () => {
  try {
    await mongoose.connection.db.collection('users').dropIndex('studentId_1');
    console.log('Dropped old studentId index');
  } catch (error) {
    // Index might not exist, which is fine
    console.log('No existing studentId index to drop');
  }
});

// Security middleware
app.use(helmet());
app.use(cors());

// Trust proxy so express-rate-limit can correctly read X-Forwarded-For when behind proxies
// For local development behind a single proxy (e.g. Docker), trust first proxy. Avoid 'true' (permissive).
app.set('trust proxy', 1);

// Apply rate limiters
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myhostelpal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MyHostelPal API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start the HTTP server (so WebSocket server attached to it works)
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
