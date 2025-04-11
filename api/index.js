// --- DIAGNOSTIC api/index.js --- // Renamed File
// Purpose: Test Vercel routing and function invocation. Does NOT perform calculations.

const express = require('express');
const path = require('path');
const app = express();

// Log ALL requests that reach this server function
app.use((req, res, next) => {
  // Log requests hitting the Node function specifically
  console.log(`API DIAGNOSTIC: Received request in api/index.js: ${req.method} ${req.url}`);
  next(); // Continue to next middleware/route
});

// Static files (Keep this to serve index.html, script.js etc.)
// --- PATH CORRECTION: Go up one level from 'api' folder to find 'public' ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// Simple /calculate route for testing invocation
app.post('/calculate', (req, res) => {
  console.log(`API DIAGNOSTIC: Reached POST /calculate handler in api/index.js.`);
  // Send a simple success response for testing
  res.status(200).json({ message: "Calculate route hit successfully!" });
});

// Basic root handler (this might not be hit if index.html is served by static first)
app.get('/', (req, res) => {
  console.log(`API DIAGNOSTIC: Reached GET / handler in api/index.js (likely served by static first).`);
  // You won't see this response if public/index.html exists and is served by the static middleware
  res.status(200).send('Hello from GET / handler in api/index.js');
});

// Catch-all for any other request reaching the server function (if not served by static)
// This helps identify if requests are unexpectedly bypassing specific routes
app.use((req, res) => {
    console.log(`API DIAGNOSTIC: Reached CATCH-ALL handler in api/index.js for ${req.method} ${req.url}`);
    res.status(404).send(`Server catch-all (api/index.js): Route ${req.method} ${req.url} not handled.`);
});


// --- IMPORTANT: Export the Express app for Vercel ---
module.exports = app;

// NOTE: Removed pricingData loading, calculation logic, and conditional app.listen
//       for this specific diagnostic test. Remember to revert after testing!
// --- END DIAGNOSTIC api/index.js ---