// --- Working server.js (for Local Development & Vercel) ---
// Purpose: Run the nuCalc server, handling static files and calculations.

const express = require('express');
const fs = require('fs');
const path = require('path');

// Ensure calculation module exists and can be required
let calculateOverallTotal;
try {
    calculateOverallTotal = require('./calculation').calculateOverallTotal;
} catch (e) {
    console.error("FATAL ERROR: Failed to require './calculation.js'. Make sure the file exists and has no syntax errors.", e);
    // Exit if calculation logic is missing, as the core functionality is broken
    process.exit(1);
}


const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default

app.use(express.json()); // Middleware to parse JSON bodies

// Simple request logger (optional, good for local debugging)
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// --- Serve Static files ---
// Ensure the 'public' directory exists at the project root
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
    console.error(`FATAL ERROR: 'public' directory not found at ${publicPath}. Static files cannot be served.`);
    // Exit if static files are missing, as the frontend won't load
    process.exit(1);
}
app.use(express.static(publicPath));
console.log(`Serving static files from: ${publicPath}`);
// --- End Serve Static files ---


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
        // Note: Server continues, but calculations might fail if pricingData is required.
        // Consider throwing an error or exiting if pricingData is absolutely essential.
    }
} catch (error) {
    console.error("Error loading or parsing pricingData.json:", error);
    // Note: Server continues, calculations might fail.
}
// --- End Load Pricing Data ---


// --- /calculate API Route ---
app.post('/calculate', (req, res) => {
  console.log("Received POST /calculate request"); // Log entry into handler
  try {
    const payload = req.body;
    // More specific validation
    if (!payload || typeof payload !== 'object' ||
        !Array.isArray(payload.sections) || // Check if sections is an array
        !payload.part2 || typeof payload.part2 !== 'object' ||
        !payload.part3 || typeof payload.part3 !== 'object' ||
        !payload.priceSetup || typeof payload.priceSetup !== 'object')
    {
        console.error("Invalid payload structure received:", JSON.stringify(payload, null, 2));
        return res.status(400).json({ error: 'Invalid request payload structure. Missing or incorrect keys/types (sections, part2, part3, priceSetup).' });
    }

    // Check if pricingData loaded properly before calculating
    if (Object.keys(pricingData).length === 0) {
        console.error("Calculation attempt failed: pricingData was not loaded.");
        return res.status(500).json({ error: 'Server configuration error: Pricing data unavailable.' });
    }

    console.log("Calling calculateOverallTotal..."); // Log before calculation call
    const result = calculateOverallTotal(payload, pricingData);
    console.log("Calculation successful. Sending result."); // Log after calculation call

    // Check if calculation function itself returned an error property
    if (result && result.error) {
         console.error('Calculation function returned an internal error:', result.error);
         // Use 500 for internal calculation issues
         return res.status(500).json({ error: result.error });
    }

    res.json(result); // Send the successful result

  } catch (error) {
    // Catch unexpected errors *during* calculation or response sending
    console.error('-----------------------------------');
    console.error('Calculation Route Exception:');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Payload Received:', JSON.stringify(req.body, null, 2));
    console.error('-----------------------------------');
    res.status(500).json({ error: 'Internal server error during calculation processing.' });
  }
});
// --- End /calculate Route ---

// --- Local Server Startup ---
// Only listen if the script is run directly (e.g., `node server.js`)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\nServer running locally on http://localhost:${PORT}`);
    console.log("Press Ctrl+C to stop the server.");
  });
}
// --- End Local Server Startup ---

// --- Export for Vercel (or other serverless platforms) ---
module.exports = app;