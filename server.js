// --- START OF FILE server.js ---

const express = require('express');
const fs = require('fs');
const path = require('path');
// Assuming calculation.js is in the same directory or configured correctly in package.json
const { calculateOverallTotal } = require('./calculation');

const app = express();
// PORT is mainly for local development; Vercel assigns its own port dynamically
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

// --- CRITICAL FOR VERCEL: Ensure 'public' exists at the root relative to server.js ---
// This line tells Express to serve files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- ADDED FOR DEBUGGING ---
console.log("Attempting to load pricingData.json...");
// --- END ADDED LINE ---

let pricingData;
try {
  // --- CRITICAL FOR VERCEL: Ensure 'pricingData.json' exists at the root ---
  const pricingPath = path.join(__dirname, 'pricingData.json');
  if (fs.existsSync(pricingPath)) {
      pricingData = JSON.parse(fs.readFileSync(pricingPath));
      console.log("Successfully loaded pricingData.json"); // Good for debugging logs
  } else {
      // Log a critical error if the file is missing. The app might not function correctly.
      console.error("CRITICAL ERROR: pricingData.json not found at path:", pricingPath);
      console.error("Ensure pricingData.json is in the root directory and committed to the repository.");
      // Assign empty object to prevent immediate crash, but calculations will fail.
      pricingData = {};
  }
} catch (error) {
    console.error("CRITICAL ERROR reading or parsing pricingData.json:", error);
    console.error("Ensure pricingData.json is valid JSON.");
    // Fallback to prevent crash, but calculations will fail.
    pricingData = {};
}


app.post('/calculate', (req, res) => {
  // Check if pricingData loaded correctly before attempting calculation
  if (!pricingData || Object.keys(pricingData).length === 0) {
     console.error("Calculation error: pricingData was not loaded correctly during server startup.");
     // Send a server configuration error status
     return res.status(500).json({ error: 'Server configuration error: Pricing data missing or invalid.' });
  }
  try {
    const payload = req.body;
    // Add validation if necessary for payload format
    if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid request body: Payload missing or not an object.' });
    }
    console.log("Received /calculate POST request."); // Log when the handler is invoked
    const result = calculateOverallTotal(payload, pricingData);
    console.log("Calculation successful, sending result."); // Log success before sending
    res.json(result);
  } catch (error) {
    // Log the detailed error on the server (visible in Vercel function logs)
    console.error('Calculation endpoint error:', error.message);
    console.error(error.stack); // Log stack trace for more details
    // Send a generic error message to the client
    res.status(500).json({ error: 'Internal server error during calculation.' });
  }
});

// --- IMPORTANT: Conditional Listening ---
// Only run app.listen when running locally (e.g., NODE_ENV is not 'production')
// Vercel environment usually sets NODE_ENV to 'production'
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

// --- IMPORTANT: Export the Express app for Vercel ---
// This allows Vercel's infrastructure to handle requests using your Express setup
module.exports = app;

// --- END OF FILE server.js ---