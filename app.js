const express = require('express');
const path = require('path');

const app = express();

// Middleware to parse URL encoded data from forms
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for serving the calculator page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle form submissions and perform calculations
app.post('/calculate', (req, res) => {
  // Extract form inputs (update these fields based on your form names)
  const { doorStyle, width, height, ...otherInputs } = req.body;
  
  // Call a function that implements your Excel logic
  const estimatedPrice = calculator({ doorStyle, width, height, ...otherInputs });
  
  // For simplicity, send back a basic text response
  // In a full app you might render a dynamic HTML page (using a templating engine)
  res.send(`Estimated Price: ${estimatedPrice}`);
});

// The calculator function (you need to implement the logic based on your Excel formulas)
function calculator(inputs) {
  // Example placeholder logic:
  let price = 0;
  
  // Re-create your Excel formulas in JavaScript
  if (inputs.doorStyle === 'Standard') {
    price = parseFloat(inputs.width) * parseFloat(inputs.height) * 10;
  } else if (inputs.doorStyle === 'Premium') {
    price = parseFloat(inputs.width) * parseFloat(inputs.height) * 15;
  }
  
  // Add further calculations as needed to match your Excel logic
  return price.toFixed(2);
}

// Start the server on port 3000 (or any port you prefer)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
