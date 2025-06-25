const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (for testing without MongoDB)
const users = [];
const messages = [];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Register User
app.post('/api/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      isOnline: false,
      lastSeen: new Date()
    };

    users.push(user);

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login User
app.post('/api/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const otherUsers = users
      .filter(u => u.id !== req.user.userId)
      .map(u => ({
        _id: u.id,
        username: u.username,
        isOnline: u.isOnline,
        lastSeen: u.lastSeen
      }))
      .sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0) || a.username.localeCompare(b.username));
    
    res.json(otherUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messagesWithSenders = messages.map(msg => ({
      _id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      sender: {
        _id: msg.senderId,
        username: users.find(u => u.id === msg.senderId)?.username || 'Unknown'
      }
    }));
    
    res.json(messagesWithSenders);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins
  socket.on('join', async (userData) => {
    try {
      const user = users.find(u => u.id === userData.userId);
      if (user) {
        user.isOnline = true;
        user.lastSeen = new Date();
        
        connectedUsers.set(socket.id, userData);
        socket.join('chat');
        
        // Notify others that user is online
        socket.to('chat').emit('userOnline', {
          userId: user.id,
          username: user.username
        });
        
        // Send online users list
        const onlineUsers = users.filter(u => u.isOnline).map(u => ({ username: u.username }));
        io.emit('onlineUsers', onlineUsers);
      }
    } catch (error) {
      console.error('Join error:', error);
    }
  });

  // Handle new message
  socket.on('sendMessage', async (messageData) => {
    try {
      const message = {
        id: Date.now().toString(),
        senderId: messageData.senderId,
        content: messageData.content,
        timestamp: new Date()
      };
      
      messages.push(message);
      
      const sender = users.find(u => u.id === messageData.senderId);
      const populatedMessage = {
        _id: message.id,
        content: message.content,
        timestamp: message.timestamp,
        sender: {
          _id: message.senderId,
          username: sender?.username || 'Unknown'
        }
      };
      
      io.emit('newMessage', populatedMessage);
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Handle typing
  socket.on('typing', (data) => {
    socket.to('chat').emit('userTyping', {
      username: data.username,
      isTyping: data.isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      try {
        const user = users.find(u => u.id === userData.userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          
          // Notify others that user is offline
          socket.to('chat').emit('userOffline', {
            userId: user.id,
            username: user.username
          });
          
          // Update online users list
          const onlineUsers = users.filter(u => u.isOnline).map(u => ({ username: u.username }));
          io.emit('onlineUsers', onlineUsers);
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      
      connectedUsers.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Using in-memory storage (no MongoDB required)');
}); 