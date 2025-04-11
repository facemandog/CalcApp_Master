// --- START OF FILE api/index.js --- // FINAL VERSION

const express = require('express');
const fs = require('fs');
const path = require('path');
// --- PATH CORRECTION: Go up one level to find calculation.js ---
const { calculateOverallTotal } = require('../calculation.js');

const app = express();
// PORT is mainly for local development; Vercel assigns its own port dynamically
const PORT = process.env.PORT || 3000; // Keep for local running consistency

app.use(express.json()); // Middleware to parse JSON request bodies

// --- PATH CORRECTION: Go up one level to find public directory ---
// Serve static files from the 'public' directory at the project root
app.use(express.static(path.join(__dirname, '..', 'public')));

console.log("Attempting to load pricingData.json..."); // Keep this log for startup debugging
let pricingData;
try {
  // --- PATH CORRECTION: Go up one level to find pricingData.json ---
  const pricingPath = path.join(__dirname, '..', 'pricingData.json');
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

// Catch-all for any other request reaching the server function
// This helps identify if requests are unexpectedly bypassing specific routes
// You might want to remove this or have it serve index.html for SPA-like behavior
// depending on whether other server routes are expected. For now, keep simple 404.
app.use((req, res) => {
    // Don't escape here unless needed, keep it simple for now
    console.log(`Reached server catch-all in api/index.js for ${req.method} ${req.url}`);
    res.status(404).send(`Server catch-all (api/index.js): Route ${req.method} ${req.url} not handled.`);
});


// --- IMPORTANT: Conditional Listening for LOCAL development ---
// Vercel environment usually sets NODE_ENV to 'production'
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    // Use 0.0.0.0 to listen on all available network interfaces locally if needed
    // console.log(`Server running locally on http://localhost:${PORT} or http://<your-local-ip>:${PORT}`);
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

// --- IMPORTANT: Export the Express app for Vercel ---
module.exports = app;

// --- END OF FILE api/index.js --- // FINAL VERSION