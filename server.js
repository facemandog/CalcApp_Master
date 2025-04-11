// --- LOCAL DEVELOPMENT server.js ---
// Purpose: Run the nuCalc server locally on a specified port.

const express = require('express');
const fs = require('fs'); // Keep fs for pricingData
const path = require('path');
const { calculateOverallTotal } = require('./calculation'); // Bring back calculation

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default

app.use(express.json()); // Middleware to parse JSON bodies

// Log requests locally if desired
app.use((req, res, next) => {
  console.log(`LOCAL: Request: ${req.method} ${req.url}`);
  // Example: Check if body exists before logging
  // if (req.body && Object.keys(req.body).length > 0) {
  //    console.log(`LOCAL: Request Body: ${JSON.stringify(req.body)}`);
  // }
  next();
});

// Static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// --- Load Pricing Data ---
let pricingData = {};
const pricingDataPath = path.join(__dirname, 'pricingData.json');
try {
    if (fs.existsSync(pricingDataPath)) {
        const rawData = fs.readFileSync(pricingDataPath);
        pricingData = JSON.parse(rawData);
        console.log("pricingData.json loaded successfully.");
    } else {
        console.error("ERROR: pricingData.json not found at path:", pricingDataPath);
        // Handle missing file - calculations might fail or return 0s
    }
} catch (error) {
    console.error("Error loading or parsing pricingData.json:", error);
}
// --- End Load Pricing Data ---


// --- /calculate Route (Full logic) ---
app.post('/calculate', (req, res) => {
  try {
    const payload = req.body;
    // Basic validation - ensure all expected top-level keys exist
    if (!payload || typeof payload !== 'object' || !payload.sections || !payload.part2 || !payload.part3 || !payload.priceSetup) {
        console.error("Invalid payload structure received:", payload);
        // Send a more informative error
        return res.status(400).json({ error: 'Invalid request payload structure. Missing required keys (sections, part2, part3, priceSetup).' });
    }

    // Call the actual calculation function
    const result = calculateOverallTotal(payload, pricingData);

    // Check if calculation returned an error itself (optional internal check)
    if (result && result.error) {
         console.error('Calculation function returned an error:', result.error);
         return res.status(500).json({ error: result.error }); // Pass internal error if available
    }

    res.json(result); // Send the successful result

  } catch (error) {
    // Catch unexpected errors during calculation or response handling
    console.error('-----------------------------------');
    console.error('Calculation Route Error Details:');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    // Avoid logging full body in production, but useful for local debugging
    console.error('Payload Received:', JSON.stringify(req.body, null, 2));
    console.error('-----------------------------------');
    res.status(500).json({ error: 'Internal server error during calculation.' });
  }
});
// --- End /calculate Route ---

// --- ADD THIS BACK for Local Execution ---
// Only listen if the script is run directly (not required by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}
// --- END ADD BACK ---

// --- IMPORTANT: Keep exporting the app for Vercel ---
module.exports = app;