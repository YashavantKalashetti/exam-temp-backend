require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = new Map();

io.on('connection', (socket) => {
  socket.on('join', ({ roomId, deviceType }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { laptop: null, phone: null });
    }
    
    const room = rooms.get(roomId);
    room[deviceType] = socket.id;
    
    console.log(`${deviceType} joined room: ${roomId}`);
    
    if (room.laptop && room.phone) {
      io.to(roomId).emit('start-connection', { deviceType });
    }
  });

  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data.offer);
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data.answer);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data.candidate);
  });

  socket.on('disconnect', () => {
    rooms.forEach((devices, roomId) => {
      if (devices.laptop === socket.id) {
        devices.laptop = null;
        io.to(roomId).emit('device-disconnected', 'laptop');
      }
      if (devices.phone === socket.id) {
        devices.phone = null;
        io.to(roomId).emit('device-disconnected', 'phone');
      }
      if (!devices.laptop && !devices.phone) {
        rooms.delete(roomId);
      }
    });
  });
});

server.listen(process.env.PORT, () => console.log('Server running on port 3001'));