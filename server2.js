// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const { calculateOverallTotal } = require('./calculation'); // Assuming calculation.js is correct

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Make sure this is before your routes
app.use(express.static(path.join(__dirname, 'public')));

// --- Load Pricing Data ---
let pricingData = {}; // Initialize empty
const pricingDataPath = path.join(__dirname, 'pricingData.json');

try {
    // Check if file exists before reading
    if (fs.existsSync(pricingDataPath)) {
        const rawData = fs.readFileSync(pricingDataPath);
        pricingData = JSON.parse(rawData);
        console.log("pricingData.json loaded successfully.");
    } else {
        console.error("ERROR: pricingData.json not found at path:", pricingDataPath);
        // Optionally, handle this case - maybe default pricing or throw error
        // For now, will proceed with empty pricingData, calculations might return 0
    }
} catch (error) {
    console.error("Error loading or parsing pricingData.json:", error);
    // Handle error appropriately, maybe exit or use default empty object
}
// --- End Load Pricing Data ---


// --- Updated /calculate Route ---
app.post('/calculate', (req, res) => {
  try {
    const payload = req.body;

    // Basic Payload Validation (Optional but Recommended)
    if (!payload || typeof payload !== 'object' || !payload.sections || !payload.part2 || !payload.priceSetup) {
        console.error("Invalid payload received:", payload);
        return res.status(400).json({ error: 'Invalid request payload structure.' });
    }

    // Call the calculation function (MUST pass pricingData)
    const result = calculateOverallTotal(payload, pricingData);

    res.json(result); // Send the detailed result object

  } catch (error) {
    // --- Enhanced Error Logging ---
    console.error('-----------------------------------');
    console.error('Calculation Error Details:');
    console.error('Timestamp:', new Date().toISOString());
    // Log the specific error message and stack trace
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    // Log the payload that caused the error (careful with sensitive data in real logs)
    // Consider logging only parts of it if necessary
    console.error('Payload Received:', JSON.stringify(req.body, null, 2)); // Log payload
    console.error('-----------------------------------');

    // Send a generic error response to the client
    res.status(500).json({ error: 'Internal server error during calculation.' });
    // --- End Enhanced Error Logging ---
  }
});
// --- End Updated /calculate Route ---

// Catch-all for serving index.html for client-side routing (if needed, not typical for this app)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});