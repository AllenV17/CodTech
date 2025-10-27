const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const { authenticateToken } = require('./middleware/auth');

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
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);

// Socket.io for real-time collaboration
const connectedUsers = new Map();
const documentStates = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join document room
  socket.on('join-document', (documentId) => {
    socket.join(documentId);
    console.log(`User ${socket.id} joined document ${documentId}`);
    
    // Send current document state to the user
    if (documentStates.has(documentId)) {
      socket.emit('document-state', documentStates.get(documentId));
    }
  });

  // Handle text changes
  socket.on('text-change', (data) => {
    const { documentId, changes, userId } = data;
    
    // Update document state
    if (!documentStates.has(documentId)) {
      documentStates.set(documentId, { content: '', version: 0 });
    }
    
    const docState = documentStates.get(documentId);
    docState.content = changes.content;
    docState.version += 1;
    
    // Broadcast changes to other users in the same document
    socket.to(documentId).emit('text-change', {
      changes,
      userId,
      version: docState.version
    });
  });

  // Handle cursor position
  socket.on('cursor-position', (data) => {
    const { documentId, position, userId } = data;
    socket.to(documentId).emit('cursor-position', { position, userId });
  });

  // Handle user typing status
  socket.on('typing', (data) => {
    const { documentId, isTyping, userId } = data;
    socket.to(documentId).emit('user-typing', { isTyping, userId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

