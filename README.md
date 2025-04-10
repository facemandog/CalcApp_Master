# nuCalc v3.4

A web-based cost estimation tool designed specifically for nuDoors projects, focusing on door and drawer replacement or refinishing services. It allows for detailed input of project dimensions, styles, features, and configurable pricing parameters to generate a professional estimate.

<!-- TODO: Add a real screenshot -->
![nuCalc Screenshot](placeholder.png)

## Key Features

*   **Dynamic Section Calculation:** Add multiple project sections, specifying dimensions (Height, Width), Door Style, Drawer Style, and Finish for each.
*   **Configurable Pricing:** Set and persist core pricing parameters (Installation per door/drawer/lazy susan, Refinishing cost/sq ft, On-site Measuring fee, Disposal cost/door) via `localStorage`.
*   **Piece Counts:** Input total counts for Doors (categorized by size), Drawers, and Lazy Susans.
*   **Special Features:** Account for custom paint choices with associated fees.
*   **Disposal Costs:** Calculate removal costs based on quantities and the configured rate.
*   **Professional Estimate Output:** Generates a clean, invoice-style estimate summarizing charges.
*   **Conditional Internal Details:** Option to show/hide internal cost breakdowns (Cost to Installer, Profit Margin, etc.) on screen and conditionally include them in the printout.
*   **Responsive Design:** Layout adapts for use on desktops, tablets (iPad, Samsung Pad), and smaller mobile devices.
*   **Collapsible Price Setup:** Horizontally collapsing section for pricing parameters to save screen space.
*   **Clear All Functionality:** Reset input fields while preserving the configured pricing setup.

## Technology Stack

*   **Backend:** Node.js, Express.js
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
*   **Data:** JSON (`pricingData.json`)
*   **Deployment:** Configured for Vercel

## Prerequisites

*   [Node.js](https://nodejs.org/) (v16.x, v18.x, or v20.x recommended)
*   [npm](https://www.npmjs.com/) (Usually included with Node.js)
*   [Git](https://git-scm.com/)

## Local Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd nuCalc # Or your repository folder name
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Ensure `pricingData.json` exists:** This file contains essential base pricing data and must be present in the root directory for the server to start.

## Running the App Locally

1.  **Start the server:**
    ```bash
    npm start
    ```
2.  Open your web browser and navigate to:
    `http://localhost:3000` (Or the port specified if different)

## File Structure Overview
