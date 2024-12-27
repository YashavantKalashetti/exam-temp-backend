require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store peer connections by examId
let peers = {};

app.use(express.static('public'));

// When a new client connects
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', ({ examId, role }) => {
    if (!peers[examId]) {
      peers[examId] = { laptop: null, mobile: null };
    }

    // Assign the client to the appropriate role (laptop or mobile)
    peers[examId][role] = socket.id;
    console.log(`${role} joined room: ${examId}`);

    socket.join(examId);

    // If both devices are connected, start signaling
    if (peers[examId].laptop && peers[examId].mobile) {
      io.to(peers[examId].laptop).emit('startVideoSync', { role: 'laptop' });
      io.to(peers[examId].mobile).emit('startVideoSync', { role: 'mobile' });
    }
  });

  // Handle offer signaling from one peer to another
  socket.on('offer', ({ offer, examId }) => {
    const otherRole = examId && peers[examId].laptop && peers[examId].mobile;
    const otherSocket = peers[examId]?.laptop || peers[examId]?.mobile;

    if (otherSocket) {
      io.to(otherSocket).emit('offer', { offer, examId });
    }
  });

  // Handle answer signaling
  socket.on('answer', ({ answer, examId }) => {
    const otherSocket = peers[examId]?.laptop || peers[examId]?.mobile;

    if (otherSocket) {
      io.to(otherSocket).emit('answer', { answer });
    }
  });

  // Handle ICE candidate signaling
  socket.on('candidate', ({ candidate, examId }) => {
    const otherSocket = peers[examId]?.laptop || peers[examId]?.mobile;

    if (otherSocket) {
      io.to(otherSocket).emit('candidate', { candidate });
    }
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    for (const examId in peers) {
      for (const role in peers[examId]) {
        if (peers[examId][role] === socket.id) {
          peers[examId][role] = null;
          break;
        }
      }

      // If both devices are disconnected, remove the examId entry
      if (!peers[examId].laptop && !peers[examId].mobile) {
        delete peers[examId];
      }
    }
  });
});

// Start server
const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
