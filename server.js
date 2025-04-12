// --- START OF FILE server.js --- // FINAL VERSION (for Contractor App - CalcApp_Master)

const express = require('express');
const fs = require('fs');
const path = require('path');
// --- Path relative to root server.js ---
const { calculateOverallTotal } = require('./calculation.js'); // Assumes calculation.js is in the root

const app = express();
// PORT for local development; Vercel assigns its own port dynamically
const PORT = process.env.PORT || 3000; // Default to 3000 if process.env.PORT is not set

app.use(express.json()); // Middleware to parse JSON request bodies

// --- Path relative to root server.js ---
// Serve static files from the 'public' directory at the project root
app.use(express.static(path.join(__dirname, 'public'))); // __dirname here is the project root

console.log("Attempting to load pricingData.json from root..."); // Startup log
let pricingData;
try {
  // --- Path relative to root server.js ---
  const pricingPath = path.join(__dirname, 'pricingData.json'); // Assumes pricingData.json is in the root
  if (fs.existsSync(pricingPath)) {
      pricingData = JSON.parse(fs.readFileSync(pricingPath));
      console.log("Successfully loaded pricingData.json");
  } else {
      console.error("CRITICAL ERROR: pricingData.json not found at path:", pricingPath);
      console.error("Ensure pricingData.json is in the root directory and committed.");
      pricingData = {}; // Allow server start, but calculations will fail
  }
} catch (error) {
    console.error("CRITICAL ERROR reading or parsing pricingData.json:", error);
    console.error("Ensure pricingData.json is valid JSON.");
    pricingData = {}; // Fallback
}


// The actual calculation route for the contractor app
app.post('/calculate', (req, res) => {
  console.log("Received POST /calculate request in server.js (Contractor App)"); // Log invocation
  // Check if pricingData loaded correctly
  if (!pricingData || Object.keys(pricingData).length === 0) {
     console.error("Calculation error: pricingData was not loaded correctly during server startup.");
     return res.status(500).json({ error: 'Server configuration error: Pricing data missing or invalid.' });
  }
  try {
    const payload = req.body;
    // Validation for the contractor payload structure
    if (!payload || typeof payload !== 'object' || !payload.sections || !payload.part2 || !payload.part3 || !payload.priceSetup) {
        console.error("Invalid contractor payload structure received:", payload);
        return res.status(400).json({ error: 'Invalid request payload structure. Missing required keys (sections, part2, part3, priceSetup).' });
    }

    console.log("Calling calculateOverallTotal (Full version)...");
    // Ensure the require('./calculation.js') loaded the FULL version of the function
    const result = calculateOverallTotal(payload, pricingData);
    console.log("Calculation successful, sending result.");
    res.json(result); // Send the full result

  } catch (error) {
    // Log detailed errors
    console.error('Calculation endpoint error:', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Internal server error during calculation.' });
  }
});

// Optional Catch-all for requests not handled by static files or /calculate
app.use((req, res) => {
    console.log(`Reached server catch-all in server.js for ${req.method} ${req.url}`);
    res.status(404).send(`Server catch-all (server.js): Route ${req.method} ${req.url} not handled.`);
});


// --- Conditional Listening for LOCAL development ONLY ---
// Check if the script is the main module being run
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Contractor App Server running locally on http://localhost:${PORT}`);
  });
} else {
    console.log("server.js loaded as a module (likely by Vercel). Skipping app.listen().");
}

// --- IMPORTANT: Export the Express app for Vercel ---
// This is ONLY needed if you deploy this version using the api/index.js structure and vercel.json.
// If you deploy this server.js from the root using Vercel's build step for server.js,
// you might not strictly need the export, but it doesn't hurt.
// **** However, your Vercel config currently points to api/index.js.
// **** If you want THIS file to run on Vercel for the contractor app,
// **** you MUST either:
// ****   A) Rename THIS file to api/index.js in the contractor project root OR
// ****   B) Update the contractor project's vercel.json `builds` and `routes` to point to "server.js" instead of "api/index.js".
module.exports = app;

// --- END OF FILE server.js --- // FINAL VERSION (for Contractor App)