const express = require('express');
const path = require('path');
const EventEmitter = require('events');

const app = express();
const port = process.env.PORT || 3000;
const chatEmitter = new EventEmitter();

// Serve static files (for chat.js, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------
// Helper Routes
// ------------------------------

// Respond with plain text
const respondText = (req, res) => {
  res.send('hi');
};

// Respond with JSON
const respondJson = (req, res) => {
  res.json({ text: 'hi', numbers: [1, 2, 3] });
};

// Echo endpoint — transforms query input
const respondEcho = (req, res) => {
  const { input = '' } = req.query;
  res.json({
    normal: input,
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
};

// 404 handler (for non-existent routes)
const respondNotFound = (req, res) => {
  res.status(404).send('Not Found');
};

// ------------------------------
// Chat App Routes
// ------------------------------

// Serve chat interface
const chatApp = (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
};

// Handle new chat messages
const respondChat = (req, res) => {
  const { message } = req.query;
  if (message) {
    chatEmitter.emit('message', message);
  }
  res.end();
};

// Server-Sent Events (SSE) connection
const respondSSE = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const onMessage = (message) => {
    res.write(`data: ${message}\n\n`);
  };

  chatEmitter.on('message', onMessage);

  res.on('close', () => {
    chatEmitter.off('message', onMessage);
  });
};

// ------------------------------
// Route Registrations
// ------------------------------
app.get('/', chatApp);
app.get('/json', respondJson);
app.get('/echo', respondEcho);
app.get('/text', respondText);
app.get('/chat', respondChat);
app.get('/sse', respondSSE);

// Catch-all 404
app.use(respondNotFound);

// ------------------------------
// Start Server
// ------------------------------
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});