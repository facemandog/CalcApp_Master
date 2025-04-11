// --- DIAGNOSTIC server.js - Minimal ---
const express = require('express');
const path = require('path'); // Keep for static path
const app = express();

console.log('DIAGNOSTIC: Minimal server.js starting...');

// Basic JSON parsing is still needed for POST
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`DIAGNOSTIC: Request: ${req.method} ${req.url}`);
  next();
});

// Serve static files (still need the frontend)
app.use(express.static(path.join(__dirname, 'public')));
console.log(`DIAGNOSTIC: Serving static from ${path.join(__dirname, 'public')}`);


// Minimal POST handler for /calculate
app.post('/calculate', (req, res) => {
  console.log('DIAGNOSTIC: Reached minimal POST /calculate handler.');
  res.status(200).json({ message: "Minimal calculate route OK!" });
});

// Optional: Minimal GET handler for root (usually served by static)
app.get('/', (req, res) => {
    console.log('DIAGNOSTIC: Reached minimal GET / handler.');
    res.send('Minimal GET / OK'); // Send something simple if static doesn't serve index.html
});

// Catch-all - IMPORTANT FOR DEBUGGING 404s
app.use((req, res) => {
    console.log(`DIAGNOSTIC: Reached CATCH-ALL for ${req.method} ${req.url}`);
    res.status(404).send(`Minimal Server Catch-all: Route ${req.method} ${req.url} not found.`);
});

// Export the app for Vercel
module.exports = app;
console.log('DIAGNOSTIC: Minimal server.js configured and exported.');