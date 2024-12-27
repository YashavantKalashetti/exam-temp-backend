require('dotenv').config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

// Initialize the Express app and create an HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io with the HTTP server
const io = socketIo(server);

// Object to store rooms and their corresponding socket IDs
const rooms = {};

// Handle client connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle the 'joinRoom' event
  socket.on("joinRoom", ({ examId }) => {
    console.log(`Socket ${socket.id} joining room: ${examId}`);
    // Store the user's socket ID by the examId
    if (!rooms[examId]) {
      rooms[examId] = [];
    }
    rooms[examId].push(socket.id);
    socket.join(examId); // Join the room

    // Send a message to all users in the room about the new user joining
    io.to(examId).emit("userJoined", { socketId: socket.id });
  });

  // Handle the 'offer' event
  socket.on("offer", (data) => {
    const { offer, examId } = data;
    console.log("Offer received from", socket.id);
    // Find the other user in the room and emit the offer to them
    const otherUserSocketId = rooms[examId].find(
      (id) => id !== socket.id
    );
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("offer", { offer });
    }
  });

  // Handle the 'answer' event
  socket.on("answer", (data) => {
    const { answer, examId } = data;
    console.log("Answer received from", socket.id);
    // Find the other user in the room and emit the answer to them
    const otherUserSocketId = rooms[examId].find(
      (id) => id !== socket.id
    );
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("answer", { answer });
    }
  });

  // Handle the 'candidate' event
  socket.on("candidate", (data) => {
    const { candidate, examId } = data;
    console.log("Candidate received from", socket.id);
    // Find the other user in the room and emit the candidate to them
    const otherUserSocketId = rooms[examId].find(
      (id) => id !== socket.id
    );
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("candidate", { candidate });
    }
  });

  // Handle disconnect event
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    // Clean up the room and remove the socket ID
    for (const examId in rooms) {
      rooms[examId] = rooms[examId].filter((id) => id !== socket.id);
      if (rooms[examId].length === 0) {
        delete rooms[examId];
      }
    }
  });
});

// Serve a basic HTML page if necessary
app.get("/", (req, res) => {
  res.send("WebRTC Signaling Server Running");
});

// Start the server on port 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
