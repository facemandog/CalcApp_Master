// --- START OF FILE api/index.js --- // FINAL VERSION (Should be correct)

const express = require('express');
const fs = require('fs');
const path = require('path');
// --- PATH CORRECTION: Go up one level to find calculation.js ---
const { calculateOverallTotal } = require('../calculation.js'); // Needs calculation.js at root

const app = express();
// PORT is mainly for local development; Vercel assigns its own port dynamically
const PORT = process.env.PORT || 3000; // Keep for local running consistency

app.use(express.json()); // Middleware to parse JSON request bodies

// --- PATH CORRECTION: Go up one level to find public directory ---
// Serve static files from the 'public' directory at the project root
app.use(express.static(path.join(__dirname, '..', 'public'))); // Needs public/ at root

console.log("Attempting to load pricingData.json..."); // Keep this log for startup debugging
let pricingData;
try {
  // --- PATH CORRECTION: Go up one level to find pricingData.json ---
  const pricingPath = path.join(__dirname, '..', 'pricingData.json'); // Needs pricingData.json at root
  if (fs.existsSync(pricingPath)) {
      pricingData = JSON.parse(fs.readFileSync(pricingPath));
      console.log("Successfully loaded pricingData.json");
  } else {
      console.error("CRITICAL ERROR: pricingData.json not found at path:", pricingPath);
      console.error("Ensure pricingData.json is in the root directory and committed.");
      pricingData = {}; // Assign empty object to allow server start, but calculations will fail
  }
} catch (error) {
    console.error("CRITICAL ERROR reading or parsing pricingData.json:", error);
    console.error("Ensure pricingData.json is valid JSON.");
    pricingData = {}; // Fallback
}


// The actual calculation route
app.post('/calculate', (req, res) => {
  console.log("Received POST /calculate request in api/index.js"); // Log invocation
  // Check if pricingData loaded correctly before attempting calculation
  if (!pricingData || Object.keys(pricingData).length === 0) {
     console.error("Calculation error: pricingData was not loaded correctly during server startup.");
     return res.status(500).json({ error: 'Server configuration error: Pricing data missing or invalid.' });
  }
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
        console.error("Invalid request body received:", payload);
        return res.status(400).json({ error: 'Invalid request body: Payload missing or not an object.' });
    }
    console.log("Calling calculateOverallTotal...");
    const result = calculateOverallTotal(payload, pricingData);
    console.log("Calculation successful, sending result.");
    res.json(result);
  } catch (error) {
    // Log the detailed error on the server (visible in Vercel function logs)
    console.error('Calculation endpoint error:', error.message);
    console.error(error.stack); // Log stack trace for more details
    // Send a generic error message to the client
    res.status(500).json({ error: 'Internal server error during calculation.' });
  }
});

// Catch-all for any other request reaching the server function AFTER static files
// This helps identify if requests are unexpectedly bypassing specific routes OR
// if static file serving isn't working as expected (though Vercel handles static first now)
app.use((req, res) => {
    console.log(`Reached server catch-all in api/index.js for ${req.method} ${req.url}`);
    // Check if the request looks like it *should* have been a static file
    if (req.url.includes('.') || req.url === '/') {
        console.warn(`Request for potential static asset ${req.url} reached function catch-all. Check 'public' directory and vercel.json.`);
        // Send a more specific 404 for static-like assets hitting the function
        return res.status(404).send(`Function catch-all: Static asset ${escapeHTML(req.url)} not found or not served correctly.`);
    }
    // For other non-API routes hitting the function
    res.status(404).send(`Function catch-all: Route ${escapeHTML(req.method)} ${escapeHTML(req.url)} not handled.`);
});

// Helper to prevent basic XSS in error messages
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
      tag => ({
          '&': '&', '<': '<', '>': '>',
          "'": ''', '"': '"'
      }[tag] || tag)
    );
}


// --- IMPORTANT: Conditional Listening for LOCAL development ---
// Vercel environment usually sets NODE_ENV to 'production'
// You can run this locally using: node api/index.js
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running locally for API testing on http://localhost:${PORT}`);
    console.log(`Static files might not be served correctly from this local instance.`);
    console.log(`Run 'node server.js' (if using it) for full local testing.`);
  });
}

// --- IMPORTANT: Export the Express app for Vercel ---
module.exports = app;

// --- END OF FILE api/index.js --- // FINAL VERSION