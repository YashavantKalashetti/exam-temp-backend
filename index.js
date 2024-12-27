require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let peers = {}; // To store connected clients by examId

// Serve static files (optional)
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  // Handle joining a room
  socket.on('joinRoom', (data) => {
    const { examId, role } = data;

    if (!peers[examId]) {
      peers[examId] = { laptop: null, mobile: null };
    }

    peers[examId][role] = socket.id;

    // Notify other clients in the same room
    socket.join(examId);
    console.log(`${role} joined room: ${examId}`);
  });

  // Handle offer signaling
  socket.on('offer', (data) => {
    const { offer, examId } = data;
    const otherRole = examId && peers[examId].laptop && peers[examId].mobile;
    const otherSocket = peers[examId]?.laptop || peers[examId]?.mobile;

    // Send offer to other peer in the room
    if (otherSocket) {
      io.to(otherSocket).emit('offer', { offer });
    }
  });

  // Handle answer signaling
  socket.on('answer', (data) => {
    const { answer, examId } = data;
    const otherRole = examId && peers[examId].laptop && peers[examId].mobile;
    const otherSocket = peers[examId]?.laptop || peers[examId]?.mobile;

    // Send answer to the peer that sent the offer
    if (otherSocket) {
      io.to(otherSocket).emit('answer', { answer });
    }
  });

  // Handle ICE candidate signaling
  socket.on('candidate', (data) => {
    const { candidate, examId } = data;
    const otherRole = examId && peers[examId].laptop && peers[examId].mobile;
    const otherSocket = peers[examId]?.laptop || peers[examId]?.mobile;

    // Send candidate to other peer in the room
    if (otherSocket) {
      io.to(otherSocket).emit('candidate', { candidate });
    }
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);

    for (const examId in peers) {
      for (const role in peers[examId]) {
        if (peers[examId][role] === socket.id) {
          peers[examId][role] = null;
          break;
        }
      }
      if (!peers[examId].laptop && !peers[examId].mobile) {
        delete peers[examId];
      }
    }
  });
});

// Start server
const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
