require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = require("socket.io")(server, {
  cors: {
    origin: ["https://exam-temp.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Send the socket ID to the connected client
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

// Error handling for server startup
server.listen(PORT, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
  console.log(`Server is running on port ${PORT}`);
});
