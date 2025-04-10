const express = require('express');
const fs = require('fs');
const path = require('path');
const { calculateOverallTotal } = require('./calculation');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pricingData = JSON.parse(fs.readFileSync(path.join(__dirname, 'pricingData.json')));

app.post('/calculate', (req, res) => {
  try {
    const payload = req.body;
    const result = calculateOverallTotal(payload, pricingData);
    res.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
