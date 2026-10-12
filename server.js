
import { createServer } from 'http';
import { readFile } from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3001;

// Create the HTTP server
const server = createServer((req, res) => {
  readFile('./public/index.html', (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading chat page');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/html'
    });

    res.end(data);
  });
});

// Create the WebSocket server
const wss = new WebSocketServer({ server });

// Broadcast messages to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

// Handle new connections
wss.on('connection', (socket, req) => {
  const username = new URL(
    req.url,
    'http://localhost'
  ).searchParams.get('username');

  // Notify everyone that a user joined
  broadcast({
    type: 'system',
    text: `${username} joined`
  });

  // Handle chat messages
  socket.on('message', (message) => {
    try {
      const { username, text } = JSON.parse(message.toString());

      broadcast({
        type: 'chat',
        username,
        text
      });
    } catch (error) {
      console.error('Invalid message received:', error);
    }
  });

  // Notify remaining users when someone leaves
  socket.on('close', () => {
    broadcast({
      type: 'system',
      text: `${username} left`
    });
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});