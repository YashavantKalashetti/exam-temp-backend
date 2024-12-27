require("dotenv").config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index'); // Serve the EJS template
});

app.get('/laptop', (req, res) => {
  res.send('Hello from the laptop');
});

io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  socket.emit('me', socket.id); // Send own ID to the client

  socket.on('callUser', (data) => {
    io.to(data.userToCall).emit('callUser', {
      from: data.from,
      name: data.name,
      signal: data.signalData
    });
  });

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id);
  });
});
// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));