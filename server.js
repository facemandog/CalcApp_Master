// --- DIAGNOSTIC server.js ---
// Purpose: Test Vercel routing and function invocation. Does NOT perform calculations.

const express = require('express');
const path = require('path');
const app = express();

// Log ALL requests that reach this server function
app.use((req, res, next) => {
  console.log(`DIAGNOSTIC: Received request: ${req.method} ${req.url}`);
  // Avoid logging potentially large bodies or sensitive headers in production logs
  // console.log(`DIAGNOSTIC: Headers: ${JSON.stringify(req.headers)}`);
  next(); // Continue to next middleware/route
});

// Static files (Keep this to serve index.html, script.js etc.)
// Make sure the 'public' folder exists at the project root
app.use(express.static(path.join(__dirname, 'public')));

// Simple /calculate route for testing invocation
app.post('/calculate', (req, res) => {
  console.log(`DIAGNOSTIC: Reached POST /calculate handler.`);
  // Send a simple success response for testing
  res.status(200).json({ message: "Calculate route hit successfully!" });
});

// Basic root handler (this might not be hit if index.html is served by static)
app.get('/', (req, res) => {
  console.log(`DIAGNOSTIC: Reached GET / handler (likely served by static first).`);
  // You won't see this response if public/index.html exists and is served
  res.status(200).send('Hello from GET / handler in server.js');
});

// Catch-all for any other request reaching the server function
// This helps identify if requests are unexpectedly bypassing specific routes
app.use((req, res) => {
    console.log(`DIAGNOSTIC: Reached CATCH-ALL handler for ${req.method} ${req.url}`);
    res.status(404).send(`Server catch-all: Route ${req.method} ${req.url} not handled by server.js.`);
});


// --- IMPORTANT: Export the Express app for Vercel ---
module.exports = app;

// NOTE: Removed pricingData loading, calculation logic, and conditional app.listen
//       for this specific diagnostic test. Remember to revert after testing!
// --- END DIAGNOSTIC server.js ---