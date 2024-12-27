require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const app = express();
const server = http.createServer(app);

// CORS configuration for Express
const allowedOrigins = ["https://exam-temp.onrender.com", "http://localhost:3000", "http://exam-temp.onrender.com"];
app.use(
  cors({
    origin: false,    // Allow requests from these origins
    methods: ["GET", "POST"],
    credentials: true,         // Allow credentials (cookies)
  })
);

// Serve static files (optional)
app.get("/", (req, res) => res.send("Server is running"));

// CORS configuration for Socket.IO
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true, // Enable credentials for cross-origin requests
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port -> ${PORT}`));