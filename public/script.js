// --- START OF FILE script.js ---
// (Corrected Selectors, Logic, and re-verified syntax)

console.log("script.js: File loading..."); // Log file start

// Define door and drawer style arrays.
const doorStyles = [
  "Shaker", "Slab", "Chamfer", "Savannah", "Beaded", "Stepped", "Ruth", "Maisie",
  "Mavis", "Dorothy", "Raised Panel", "Split Shaker", "Jean", "Nora", "Amelia",
  "Millie", "Glass", "Frances", "Alice", "Mabel", "Bessie", "Winona", "Eleanor", "Georgia"
];
const drawerStyles = doorStyles.filter(style =>
  !["Glass", "Georgia", "Split Shaker", "Winona", "Bessie", "Nora"].includes(style)
);

// Global variables
let globalTotalSqFt = 0;
let globalTotalDoors = 0; // This represents ACTUAL doors entered
let globalTotalDrawers = 0;

/** Retrieves data from a dynamic Rough Estimate section. */
function getSectionData(sectionDiv) {
    // Ensure sectionDiv exists before querying
    if (!sectionDiv) {
        console.error("getSectionData called with invalid sectionDiv");
        return {}; // Return empty object or handle error appropriately
    }
    try {
        return {
            doorStyle: sectionDiv.querySelector('select[name="sectionDoorStyle"]')?.value || '', // Use optional chaining and default value
            drawerStyle: sectionDiv.querySelector('select[name="sectionDrawerStyle"]')?.value || '',
            finish: sectionDiv.querySelector('select[name="sectionFinish"]')?.value || '',
            height: parseFloat(sectionDiv.querySelector('input[name="sectionHeight"]')?.value) || 0,
            width: parseFloat(sectionDiv.querySelector('input[name="sectionWidth"]')?.value) || 0
        };
    } catch (error) {
        console.error("Error in getSectionData for section:", sectionDiv, error);
        return {}; // Return empty on error
    }
}


// Forward declaration
let updateTotals;

/** Creates a dynamic Rough Estimate section. */
function createRoughEstimateSection(index) {
    console.log(`Creating section ${index + 1}`); // Log section creation
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section';
    sectionDiv.dataset.index = index;

    // Add a header div and place the section-id inside it
    sectionDiv.innerHTML = `
      <div class="section-header">
         <span class="section-id">Section ${index + 1}</span>
      </div>
      <label>
        Door Style:
        <select name="sectionDoorStyle">
          ${doorStyles.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </label>
      <label>
        Drawer Style:
        <select name="sectionDrawerStyle">
          ${drawerStyles.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </label>
      <label>
        Finish:
        <select name="sectionFinish">
          <option value="Painted">Painted</option>
          <option value="Painted">Van Deusan Blue HC-156</option>
          <option value="Painted">Kendal Charcoal HC-166</option>
          <option value="Painted">White Dove OC-17</option>
          <option value="Painted">Card Room Green No.79</option>
          <option value="Painted">Accessible Beige 7036</option>
          <option value="Painted">Stock white/Decorators White</option>
          <option value="Primed">Primed</option>
          <option value="Unfinished">Unfinished</option>
        </select>
      </label>
      <div class="dimension-inputs">
        <label>
          Height (in):
          <input type="number" name="sectionHeight" value="12" step="0.1" required />
        </label>
        <label>
          Width (in):
          <input type="number" name="sectionWidth" value="12" step="0.1" required />
        </label>
      </div>
    `; // Removed button adding from innerHTML

    if (index > 0) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'remove-button';
      removeBtn.addEventListener('click', () => {
        sectionDiv.remove();
        updateSectionIndices();
        if (typeof updateTotals === 'function') {
          updateTotals();
        }
      });
      sectionDiv.appendChild(removeBtn); // Append button separately
    }

    // Add event listeners to new section's inputs/selects
    sectionDiv.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', () => {
           if (typeof updateTotals === 'function') updateTotals();
      });
      input.addEventListener('input', () => { // Catch number input changes
           if (typeof updateTotals === 'function') updateTotals();
      });
    });

    return sectionDiv;
  }

/** Updates the indices for dynamic Rough Estimate sections. */
function updateSectionIndices() {
    const sections = document.querySelectorAll('#sectionsContainer .section');
    sections.forEach((sec, idx) => {
      sec.dataset.index = idx;
      const sectionIdSpan = sec.querySelector('.section-id');
      if (sectionIdSpan) {
          sectionIdSpan.textContent = `Section ${idx + 1}`;
      }
    });
}

/** Loads pricing settings from localStorage. */
function loadPricingSettings() {
    const pricingFields = [
      { name: 'pricePerDoor', container: '#priceSetupContainer' },
      { name: 'pricePerDrawer', container: '#priceSetupContainer' },
      { name: 'refinishingCostPerSqFt', container: '#priceSetupContainer' },
      { name: 'pricePerLazySusan', container: '#priceSetupContainer' },
      { name: 'onSiteMeasuring', container: '#priceSetupContainer' },
      { name: 'doorDisposalCost', container: '#priceSetupContainer' },
      { name: 'calculateDisposal', container: '#priceSetupContainer' } // Dropdown is in price setup
    ];

    pricingFields.forEach(field => {
      const input = document.querySelector(`${field.container} [name="${field.name}"]`);
      if (input) {
          const savedValue = localStorage.getItem(field.name);
          if (savedValue !== null && savedValue !== "") {
              input.value = savedValue;
          } else {
              const defaultValue = input.tagName === 'SELECT' ? input.querySelector('option[selected]')?.value : input.getAttribute('value');
              if (defaultValue !== null && defaultValue !== undefined) {
                  input.value = defaultValue;
              } else if(input.tagName === 'SELECT') {
                  input.value = 'no';
              }
          }
      } else {
           // console.warn(`Load Settings: Input for [name="${field.name}"] not found in ${field.container}`);
      }
    });
    saveCurrentPriceSetupValues();
}


/** Saves a pricing field's value to localStorage. */
function savePricingSetting(e) {
    if (e.target.name) {
      localStorage.setItem(e.target.name, e.target.value);
      saveCurrentPriceSetupValues();
    }
}

/** Helper function to save the current state of price setup inputs. */
function saveCurrentPriceSetupValues() {
    const priceSetupValues = {};
    // Query inputs/selects ONLY within price setup container
    document.querySelectorAll('#priceSetupContainer input, #priceSetupContainer select').forEach(input => {
        if (input.name) {
            priceSetupValues[input.name] = input.value;
        }
    });
    // Add special features inputs separately (now only customPaintQty)
     const customPaintInput = document.querySelector('#specialFeatures input[name="customPaintQty"]');
     if(customPaintInput) {
         priceSetupValues['customPaintQty'] = customPaintInput.value;
     }
    localStorage.setItem('priceSetupValues', JSON.stringify(priceSetupValues));
}


/** Helper function to format currency. */
function formatCurrency(value) {
    const number = Number(value);
    if (isNaN(number)) {
        return '$0.00';
    }
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

console.log("script.js: Defining DOMContentLoaded listener..."); // Log before listener

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("script.js: DOMContentLoaded event fired."); // Initial Debug Log

    // Get references to essential elements
    const sectionsContainer = document.getElementById('sectionsContainer');
    const addSectionBtn = document.getElementById('addSectionBtn');
    const calcForm = document.getElementById('calcForm');
    const priceSetupContainer = document.getElementById('priceSetupContainer');
    const togglePriceSetupBtn = document.getElementById('togglePriceSetupBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const resultsDiv = document.getElementById('results');
    const printBtnContainer = document.getElementById('printButtonContainer');
    const instructionsDiv = document.getElementById('instructions');
    const toggleInstructionsBtn = document.getElementById('toggleInstructionsBtn');

    // Check if essential elements were found
    if (!sectionsContainer || !addSectionBtn || !calcForm || !priceSetupContainer || !togglePriceSetupBtn || !clearAllBtn || !resultsDiv || !printBtnContainer) {
        console.error("CRITICAL ERROR: One or more essential HTML elements not found. Check IDs in index.html.");
        document.body.innerHTML = '<h1 style="color: red;">Error: Application UI failed to initialize. Please check console.</h1>';
        return; // Stop further execution
    }
    console.log("Essential elements references obtained.");

  /** Function to update global totals (only counts needed for payload). */
  updateTotals = function() {
        const sections = document.querySelectorAll('#sectionsContainer .section');
        let totalSqFt = 0;
        sections.forEach(sec => {
          const height = parseFloat(sec.querySelector('input[name="sectionHeight"]')?.value) || 0; // Added optional chaining
          const width = parseFloat(sec.querySelector('input[name="sectionWidth"]')?.value) || 0; // Added optional chaining
          totalSqFt += (height * width) / 144;
        });
        globalTotalSqFt = totalSqFt;

        // Use optional chaining for safety, although these elements should exist
        const doors0 = parseInt(document.querySelector('input[name="doors_0_36"]')?.value) || 0;
        const doors36 = parseInt(document.querySelector('input[name="doors_36_60"]')?.value) || 0;
        const doors60 = parseInt(document.querySelector('input[name="doors_60_82"]')?.value) || 0;
        globalTotalDoors = doors0 + doors36 + doors60;

        globalTotalDrawers = parseInt(document.querySelector('input[name="numDrawers"]')?.value) || 0;
        // console.log("Totals updated:", { globalTotalSqFt, globalTotalDoors, globalTotalDrawers }); // Optional debug
  };
  console.log("updateTotals function defined.");

  // Load pricing settings.
  try {
      console.log("Loading pricing settings...");
      loadPricingSettings();
      console.log("Pricing settings loaded.");
  } catch (error) {
      console.error("Error during loadPricingSettings:", error);
  }


  // Attach listeners to pricing input fields & select
  try {
      console.log("Attaching listeners to Price Setup/Special Features inputs...");
      // Select inputs/selects within specific containers
      document.querySelectorAll('#priceSetupContainer input, #priceSetupContainer select, #specialFeatures select').forEach(input => { // Include specialFeatures select if needed
        input.addEventListener('change', savePricingSetting);
        if (input.type === 'number') input.addEventListener('input', savePricingSetting);
      });
      console.log("Price Setup/Special Features listeners attached.");
  } catch (error) {
      console.error("Error attaching listeners to Price Setup/Special Features inputs:", error);
  }


  // Price Setup Toggle Logic.
  if (togglePriceSetupBtn && priceSetupContainer) {
      togglePriceSetupBtn.addEventListener('click', () => {
        const isCollapsed = priceSetupContainer.classList.contains('collapsed');
        if (isCollapsed) {
            priceSetupContainer.classList.remove('collapsed');
            togglePriceSetupBtn.textContent = 'Hide';
        } else {
            priceSetupContainer.classList.add('collapsed');
            togglePriceSetupBtn.textContent = 'Show';
        }
      });
      console.log("Price Setup toggle listener attached.");
  } else {
      console.error("Price Setup toggle button or container not found for listener.");
  }


  // Toggle Instructions Logic
  if (toggleInstructionsBtn && instructionsDiv) {
      toggleInstructionsBtn.addEventListener('click', () => {
          const isHidden = instructionsDiv.style.display === 'none';
          if (isHidden) {
              instructionsDiv.style.display = 'block';
              toggleInstructionsBtn.textContent = 'Hide Directions';
          } else {
              instructionsDiv.style.display = 'none';
              toggleInstructionsBtn.textContent = 'Show Directions';
          }
      });
      console.log("Instructions toggle listener attached.");
  } else {
      // Log if button specifically is missing, div might be intentional
      if (!toggleInstructionsBtn) console.warn("Instructions toggle button (#toggleInstructionsBtn) not found.");
      // console.warn("Instructions div (#instructions) not found."); // Less critical maybe
  }

  // Initialize sections.
  function initializeSections() {
        console.log("Initializing sections...");
        // Ensure sectionsContainer exists before modifying
        if (!sectionsContainer) {
            console.error("Cannot initialize sections, container not found.");
            return;
        }
        sectionsContainer.innerHTML = ''; // Clear first
        try {
            for (let i = 0; i < 2; i++) {
              sectionsContainer.appendChild(createRoughEstimateSection(i));
            }
            updateTotals(); // Update totals after sections are added
            console.log("Sections initialized successfully.");
        } catch (error) {
             console.error("Error during initializeSections:", error);
        }
  }
  initializeSections();

  // Add Section Button.
  if(addSectionBtn){
      addSectionBtn.addEventListener('click', () => {
        console.log("Add section button clicked.");
        try { // Wrap in try-catch
            const index = sectionsContainer.children.length;
            sectionsContainer.appendChild(createRoughEstimateSection(index));
            updateTotals();
        } catch (error) {
            console.error("Error executing Add Section click handler:", error);
        }
      });
      console.log("Add Section listener attached.");
  } else {
       console.error("Add Section button not found for listener.");
  }


  // Attach listeners to update totals for Piece Count & Special Features numbers.
  try {
      console.log("Attaching listeners to Piece Count/Special Features number inputs...");
      document.querySelectorAll('#hingeDrilling input[type="number"], #specialFeatures input[type="number"]').forEach(input => {
         input.addEventListener('input', updateTotals);
         input.addEventListener('change', updateTotals);
      });
      console.log("Piece Count/Special Features number input listeners attached.");
  } catch (error) {
      console.error("Error attaching listeners to Piece Count/Special Features inputs:", error);
  }


  // Clear All button functionality.
  if(clearAllBtn){
      clearAllBtn.addEventListener('click', () => {
        console.log("Clear All button clicked.");
        try {
            // Reset non-Price Setup form elements more selectively
            document.querySelectorAll('#roughEstimateContainer input, #roughEstimateContainer select, #otherPartsContainer input, #otherPartsContainer select').forEach(el => {
                // Skip elements within Price Setup if they were somehow included
                if (el.closest('#priceSetupContainer')) return;

                if (el.tagName === 'INPUT') {
                    const type = el.type.toLowerCase();
                    // Reset numbers to 0, others blank
                    if (type === 'number') el.value = el.getAttribute('value') || '0';
                    else if (type === 'text') el.value = '';
                    // Add other input types if necessary
                } else if (el.tagName === 'SELECT') {
                    // Reset selects to the first option
                    el.selectedIndex = 0;
                }
            });

            // Reinitialize dynamic sections (Clears old ones, adds 2 new)
            initializeSections(); // This also calls updateTotals

            // Restore Price Setup values from saved object
            const priceSetupValues = JSON.parse(localStorage.getItem('priceSetupValues') || '{}');
            document.querySelectorAll('#priceSetupContainer input, #priceSetupContainer select').forEach(input => {
                const fieldName = input.name;
                if (!fieldName) return; // Skip inputs without names
                let defaultValue = '';
                if (input.tagName === 'SELECT') {
                    defaultValue = 'no'; // Default for select
                } else {
                    defaultValue = input.getAttribute('value') || ''; // Default for input
                }
                input.value = priceSetupValues[fieldName] !== undefined ? priceSetupValues[fieldName] : defaultValue;
            });

            // Ensure Price Setup is expanded
            priceSetupContainer.classList.remove('collapsed');
            togglePriceSetupBtn.textContent = 'Hide';

            // Reset Instructions Toggle state
            if (instructionsDiv && toggleInstructionsBtn) {
                instructionsDiv.style.display = 'none';
                toggleInstructionsBtn.textContent = 'Show Directions';
            }

            // Clear results display
            resultsDiv.innerHTML = '';
            if (printBtnContainer) printBtnContainer.style.display = 'none';

            console.log("Clear All finished.");
        } catch (error) {
            console.error("Error during Clear All execution:", error);
        }
      });
      console.log("Clear All listener attached.");
  } else {
       console.error("Clear All button not found for listener.");
  }


  // On form submit, build the payload and send it.
  if(calcForm){
      calcForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Form submitted. Preventing default.");
        try {
            updateTotals();
            console.log("Totals updated for submit.");

            // Build Payload
            const sections = [];
            document.querySelectorAll('#sectionsContainer .section').forEach(sec => {
                sections.push(getSectionData(sec));
            });
            const formData = new FormData(e.target);
            const payload = {
              sections: sections,
              part2: {
                numDrawers: parseInt(formData.get('numDrawers')) || 0,
                doors_0_36: parseInt(formData.get('doors_0_36')) || 0,
                doors_36_60: parseInt(formData.get('doors_36_60')) || 0,
                doors_60_82: parseInt(formData.get('doors_60_82')) || 0,
                lazySusanQty: parseInt(formData.get('lazySusanQty')) || 0,
                totalDoors: globalTotalDoors
              },
              part3: { // Contains only non-price-setup fields from its section
                customPaintQty: parseInt(formData.get('customPaintQty')) || 0,
                 // Disposal setting is now read from Price Setup below
              },
              priceSetup: { // Get all price setup values from form
                pricePerDoor: parseFloat(formData.get('pricePerDoor')) || 0,
                pricePerDrawer: parseFloat(formData.get('pricePerDrawer')) || 0,
                refinishingCostPerSqFt: parseFloat(formData.get('refinishingCostPerSqFt')) || 0,
                pricePerLazySusan: parseFloat(formData.get('pricePerLazySusan')) || 0,
                onSiteMeasuring: parseFloat(formData.get('onSiteMeasuring')) || 0,
                doorDisposalCost: parseFloat(formData.get('doorDisposalCost')) || 0,
                calculateDisposal: formData.get('calculateDisposal') || 'no', // Get disposal setting from correct location
                onSiteMeasuringSqFt: globalTotalSqFt
              }
            };

            console.log("Payload constructed:", JSON.stringify(payload, null, 2));

            resultsDiv.innerHTML = '<p>Calculating...</p>';
            if(printBtnContainer) printBtnContainer.style.display = 'none';

            const response = await fetch('/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log("Fetch response received. Status:", response.status);

            // Corrected Body Reading Logic
            let responseData;
            let responseBodyText = '';
            try {
                const clonedResponse = response.clone();
                responseBodyText = await clonedResponse.text();
                responseData = await response.json();
            } catch (jsonError) {
                console.warn("Could not parse response as JSON:", jsonError);
                responseData = { error: `Invalid JSON response from server (Status: ${response.status}). Body: ${responseBodyText}` };
                if (response.ok) {
                     const formatError = new Error(responseData.error);
                     formatError.status = response.status;
                     throw formatError;
                }
            }

            if (!response.ok) {
                const status = response.status;
                const errorMessage = responseData?.error || responseBodyText || `HTTP error! Status: ${status} ${response.statusText}`;
                const error = new Error(errorMessage);
                error.status = status;
                console.error("Fetch response not OK:", error);
                throw error;
            }

            console.log("Fetch successful. Displaying results...");
            displayResults(responseData);
            if(printBtnContainer) printBtnContainer.style.display = 'block';

        } catch (err) {
          console.error("Calculation Fetch/Process Error:", err);

          let displayErrorMessage = err.message || 'An unknown error occurred.';

          if (err.status === 404) {
            displayErrorMessage = `Error: Calculation endpoint not found (404). Check server routing/deployment. Raw message: ${err.message}`;
            console.error('Specific Error Detail: Resource Not Found (404)');
          } else if (err.status) {
             displayErrorMessage = `Error: Server returned status ${err.status}. Raw message: ${err.message}`;
             console.error(`Specific Error Detail: HTTP Status ${err.status}`);
          } else {
              console.error("Specific Error Detail: Network error, CORS issue, or JS error before fetch.");
          }

          resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error Calculating Estimate:</strong></p><p>${escape(displayErrorMessage)}</p></div>`;
          if(printBtnContainer) printBtnContainer.style.display = 'none';
        }
      });
      console.log("Submit listener attached to calcForm.");
  } else {
      console.error("Calculate form not found for listener attachment.");
  }


  // --- displayResults function (keep as is) ---
  function displayResults(resultData) {
    console.log("Displaying results for:", resultData);
     if (!resultData || typeof resultData !== 'object') {
        console.error("Invalid resultData received in displayResults:", resultData);
        resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error:</strong></p><p>Received invalid response format from server.</p></div>`;
        if (printBtnContainer) printBtnContainer.style.display = 'none';
        return;
    }
    if (resultData.error) {
        console.error("Server returned error:", resultData.error);
        resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error from Server:</strong></p><p>${escape(resultData.error)}</p></div>`;
        if (printBtnContainer) printBtnContainer.style.display = 'none';
        return;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const specialFeatures = resultData.specialFeatures || {};
    const installation = resultData.installation || {};
    const part2 = resultData.part2 || {};
    const priceSetup = resultData.priceSetup || {};


    const overallTotal = formatCurrency(resultData.overallTotal);
    const allSectionsCost = formatCurrency(resultData.doorCostTotal);
    const hingeCost = formatCurrency(resultData.hingeCost);
    const refinishingCost = formatCurrency(resultData.refinishingCost);
    const measuringCost = formatCurrency(resultData.measuringCost);
    const disposalCostVal = resultData.disposalCost || 0;
    const disposalCost = formatCurrency(disposalCostVal);
    const customPaintCostVal = specialFeatures.customPaintCost || 0;
    const customPaintCost = formatCurrency(customPaintCostVal);
    const totalInstallCost = formatCurrency(installation.totalInstall);
    const lazySusanSurchargeVal = (part2.lazySusanQty || 0) * 50;

    const costToInstaller = formatCurrency(resultData.costToInstaller);
    const profitMargin = formatCurrency(resultData.profitMargin);
    const actualTotalDoors = part2.totalDoors ?? 0;
    const lazySusanQty = part2.lazySusanQty ?? 0;
    const displayedTotalDoors = actualTotalDoors + (lazySusanQty * 2);
    const totalDrawers = part2.numDrawers ?? 0;
    const hingeCount = resultData.hingeCount ?? 'N/A';
    const doorsForDisposal = resultData.doorsForDisposal ?? 0;
    const drawersForDisposal = 0; // Assuming backend doesn't send this
    const lazySusansForDisposal = resultData.lazySusansForDisposal ?? 0;
    const calculateDisposalFlag = priceSetup.calculateDisposal === 'yes';


    let html = `
      <div class="invoice">
        <div class="invoice-header">
          <img src="assets/logo.png" alt="nuDoors Logo" class="invoice-logo">
          <h1>Project Estimate</h1>
          <p>Date: ${dateStr}</p>
        </div>
        <hr class="invoice-hr">
        <h2>Summary of Charges</h2>
        <table class="summary-table">
          <tbody>
            <tr><td class="table-label">Door & Drawer Fronts (All Sections)</td><td class="table-value">${allSectionsCost}</td></tr>
            <tr><td class="table-label">Hinge & Hardware Charge</td><td class="table-value">${hingeCost}</td></tr>
            ${customPaintCostVal > 0 ? `<tr><td class="table-label">Custom Paint</td><td class="table-value">${customPaintCost}</td></tr>` : ''}
            <tr><td class="table-label">Refinishing (${globalTotalSqFt.toFixed(2)} sq ft)</td><td class="table-value">${refinishingCost}</td></tr>
            <tr><td class="table-label">On-Site Measuring</td><td class="table-value">${measuringCost}</td></tr>
            <tr><td class="table-label">Installation (Doors, Drawers, Lazy Susans)</td><td class="table-value">${totalInstallCost}</td></tr>
            ${disposalCostVal > 0 ? `<tr><td class="table-label">Disposal Fee</td><td class="table-value">${disposalCost}</td></tr>` : ''}
            ${lazySusanSurchargeVal > 0 ? `<tr><td class="table-label">Lazy Susan Surcharge</td><td class="table-value">${formatCurrency(lazySusanSurchargeVal)}</td></tr>` : ''}
          </tbody>
          <tfoot>
            <tr class="total-row"><td class="table-label">Estimated Project Total</td><td class="table-value">${overallTotal}</td></tr>
          </tfoot>
        </table>
        <hr class="invoice-hr">
        <button type="button" id="toggleDetailsBtn" class="toggle-details-btn">Show Internal Details</button>
        <div id="internalDetails" class="details-section" style="display: none;">
            <h3>Internal Cost Breakdown</h3>
             <table class="details-table">
                 <tr><td>Total Doors Installed (incl. Lazy Susan pairs):</td><td>${displayedTotalDoors}</td></tr>
                 <tr><td>Total Drawers Installed:</td><td>${totalDrawers}</td></tr>
                 <tr><td>Actual Doors (for Install Cost):</td><td>${actualTotalDoors}</td></tr>
                 <tr><td>Number of Lazy Susans:</td><td>${lazySusanQty}</td></tr>
                 <tr><td>Hinge Count:</td><td>${hingeCount}</td></tr>
                 <tr><td>Installation - Doors:</td><td>${formatCurrency(installation.doorInstall)}</td></tr>
                 <tr><td>Installation - Drawers:</td><td>${formatCurrency(installation.drawerInstall)}</td></tr>
                 <tr><td>Installation - Lazy Susans:</td><td>${formatCurrency(installation.lazySusanInstall)}</td></tr>
                 ${lazySusanSurchargeVal > 0 ? `<tr><td>Lazy Susan Surcharge:</td><td>${formatCurrency(lazySusanSurchargeVal)}</td></tr>` : ''}
                 <tr><td>Cost To Installer (Materials + Hinge Drilling):</td><td>${costToInstaller}</td></tr>
                 <tr><td>Profit Margin:</td><td>${profitMargin}</td></tr>
                 ${calculateDisposalFlag ? `
                 <tr><td colspan="2" style="padding-top:1em; font-weight:bold; border-bottom: none;">Disposal Details (Calculated):</td></tr>
                 <tr><td>   Doors for Disposal:</td><td>${doorsForDisposal}</td></tr>
                 <tr><td>   Drawers for Disposal:</td><td>${drawersForDisposal}</td></tr>
                 <tr><td>   Lazy Susans for Disposal:</td><td>${lazySusansForDisposal}</td></tr>
                 <tr><td>   Calculated Disposal Cost:</td><td>${disposalCost}</td></tr>
                 ` : `
                 <tr><td colspan="2" style="padding-top:1em;">Disposal Cost Not Included</td></tr>
                 `}
             </table>
        </div>
        <p class="estimate-footer">Thank you for choosing nuDoors! This estimate is valid for 30 days.</p>
      </div>
    `;

    resultsDiv.innerHTML = html;

    // Re-attach listener for the toggle button inside the results
    const toggleBtn = document.getElementById('toggleDetailsBtn');
    const detailsDiv = document.getElementById('internalDetails');
    if (toggleBtn && detailsDiv) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = detailsDiv.style.display === 'none';
            detailsDiv.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Hide Internal Details' : 'Show Internal Details';
        });
         console.log("Toggle Details listener attached.");
    } else {
        console.error("Toggle Details button or div not found after results display.");
    }

    if(printBtnContainer) printBtnContainer.style.display = 'block';
  }

  // --- Keep print logic and conditional print logic ---
   const printEstimateBtn = document.getElementById('printEstimate');
   if (printEstimateBtn) {
       printEstimateBtn.addEventListener('click', () => window.print());
        console.log("Print listener attached.");
   } else {
        console.error("Print button not found for listener.");
   }


   window.onbeforeprint = () => {
        const resultsDivActive = document.getElementById('results');
        const internalDetailsDiv = resultsDivActive ? resultsDivActive.querySelector('#internalDetails') : null;
        if (internalDetailsDiv && internalDetailsDiv.style.display !== 'none') {
            internalDetailsDiv.classList.add('print-section');
        } else if (internalDetailsDiv) {
             internalDetailsDiv.classList.remove('print-section');
        }
    };

    window.onafterprint = () => {
        const resultsDivActive = document.getElementById('results');
        const internalDetailsDiv = resultsDivActive ? resultsDivActive.querySelector('#internalDetails') : null;
        if (internalDetailsDiv) {
            internalDetailsDiv.classList.remove('print-section');
        }
    };

  /** Helper function to escape HTML (simple version) */
  function escape(str) {
    console.log("Escape function called."); // Log when escape is called
    if (!str) return '';
    const map = { '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' };
    // Use a regex that correctly handles all specified characters
    return String(str).replace(/[&<>"']/g, function (m) { return map[m]; });
  }
  console.log("Escape function defined.");


   console.log("script.js: DOMContentLoaded setup complete."); // Final Debug Log

}); // End DOMContentLoaded

console.log("script.js: File finished parsing."); // Log file end