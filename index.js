require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active connections
const rooms = new Map();

app.use(cors());
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', ({ examId, role }) => {
    // Create room if it doesn't exist
    if (!rooms.has(examId)) {
      rooms.set(examId, { laptop: null, mobile: null });
    }
    
    const room = rooms.get(examId);
    room[role] = socket.id;
    
    socket.join(examId);
    console.log(`${role} joined room ${examId}`);

    // If both peers are connected, initiate connection
    if (room.laptop && room.mobile) {
      io.to(examId).emit('ready', { examId });
    }
  });

  // Handle WebRTC signaling
  socket.on('offer', ({ offer, examId, targetRole }) => {
    const room = rooms.get(examId);
    if (room) {
      const targetId = room[targetRole];
      if (targetId) {
        io.to(targetId).emit('offer', { offer, examId });
      }
    }
  });

  socket.on('answer', ({ answer, examId, targetRole }) => {
    const room = rooms.get(examId);
    if (room) {
      const targetId = room[targetRole];
      if (targetId) {
        io.to(targetId).emit('answer', { answer, examId });
      }
    }
  });

  socket.on('iceCandidate', ({ candidate, examId, targetRole }) => {
    const room = rooms.get(examId);
    if (room) {
      const targetId = room[targetRole];
      if (targetId) {
        io.to(targetId).emit('iceCandidate', { candidate, examId });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove disconnected peer from rooms
    rooms.forEach((room, examId) => {
      if (room.laptop === socket.id) {
        room.laptop = null;
        io.to(examId).emit('peerDisconnected', { role: 'laptop' });
      }
      if (room.mobile === socket.id) {
        room.mobile = null;
        io.to(examId).emit('peerDisconnected', { role: 'mobile' });
      }
      
      // Clean up empty rooms
      if (!room.laptop && !room.mobile) {
        rooms.delete(examId);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});