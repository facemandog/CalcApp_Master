// --- START OF FILE api/index.js --- // FINAL VERSION (for nuCalcUF)

const express = require('express');
const fs = require('fs');
const path = require('path');
// --- PATH CORRECTION: Ensure calculation.js (DIY version) is in nuCalcUF root ---
const { calculateOverallTotal } = require('../calculation.js');

const app = express();
// PORT for local development; Vercel assigns its own port dynamically
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

// --- PATH CORRECTION: Ensure public folder is in nuCalcUF root ---
// Serve static files from the 'public' directory at the project root (nuCalcUF)
app.use(express.static(path.join(__dirname, '..', 'public')));

console.log("Attempting to load pricingData.json..."); // Startup log
let pricingData;
try {
  // --- PATH CORRECTION: Ensure pricingData.json is in nuCalcUF root ---
  const pricingPath = path.join(__dirname, '..', 'pricingData.json');
  if (fs.existsSync(pricingPath)) {
      pricingData = JSON.parse(fs.readFileSync(pricingPath));
      console.log("Successfully loaded pricingData.json");
  } else {
      console.error("CRITICAL ERROR: pricingData.json not found at path:", pricingPath);
      console.error("Ensure pricingData.json is in the root directory (nuCalcUF) and committed.");
      pricingData = {}; // Allow server start, but calculations will fail
  }
} catch (error) {
    console.error("CRITICAL ERROR reading or parsing pricingData.json:", error);
    console.error("Ensure pricingData.json is valid JSON.");
    pricingData = {}; // Fallback
}


// The actual calculation route for the DIY wizard
app.post('/calculate', (req, res) => {
  console.log("Received POST /calculate request in api/index.js (nuCalcUF)"); // Log invocation
  // Check if pricingData loaded correctly
  if (!pricingData || Object.keys(pricingData).length === 0) {
     console.error("Calculation error: pricingData was not loaded correctly.");
     return res.status(500).json({ error: 'Server configuration error: Pricing data missing or invalid.' });
  }
  try {
    const payload = req.body;
    // Basic validation for the expected DIY payload structure
    if (!payload || typeof payload !== 'object' || !payload.sections || !payload.part2 || !payload.part3 ) {
        // Note: priceSetup might be minimal or absent in DIY payload, adjust validation if needed
        console.error("Invalid DIY payload structure received:", payload);
        return res.status(400).json({ error: 'Invalid request payload structure. Missing required keys (sections, part2, part3).' });
    }

    console.log("Calling calculateOverallTotal (DIY version)...");
    // Ensure the require('../calculation.js') loaded the DIY version of the function
    const result = calculateOverallTotal(payload, pricingData);
    console.log("Calculation successful, sending result.");
    res.json(result); // Send the result calculated by the DIY logic

  } catch (error) {
    // Log detailed errors
    console.error('Calculation endpoint error:', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Internal server error during calculation.' });
  }
});

// Optional Catch-all for requests not handled by static files or /calculate
app.use((req, res) => {
    console.log(`Reached server catch-all in api/index.js for ${req.method} ${req.url}`);
    res.status(404).send(`Server catch-all (api/index.js): Route ${req.method} ${req.url} not handled.`);
});


// --- Conditional Listening for LOCAL development ONLY ---
// Check if the script is the main module being run (e.g., `node api/index.js`)
// and not just being required by Vercel's runtime.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`nuCalcUF Server running locally on http://localhost:${PORT}`);
  });
} else {
    // Add a log for when it's loaded by Vercel (or other require())
    console.log("api/index.js loaded as a module (likely by Vercel). Skipping app.listen().");
}

// --- IMPORTANT: Export the Express app for Vercel ---
module.exports = app;

// --- END OF FILE api/index.js --- // FINAL VERSION (for nuCalcUF)