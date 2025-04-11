// --- START OF FILE script.js ---
// (Corrections for Disposal Dropdown Logic)

console.log("script.js: File loading...");

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
let globalTotalDoors = 0; // Actual doors entered
let globalTotalDrawers = 0;

/** Retrieves data from a dynamic Rough Estimate section. */
function getSectionData(sectionDiv) {
    if (!sectionDiv) { console.error("getSectionData called with invalid sectionDiv"); return {}; }
    try {
        return {
            doorStyle: sectionDiv.querySelector('select[name="sectionDoorStyle"]')?.value || '',
            drawerStyle: sectionDiv.querySelector('select[name="sectionDrawerStyle"]')?.value || '',
            finish: sectionDiv.querySelector('select[name="sectionFinish"]')?.value || '',
            height: parseFloat(sectionDiv.querySelector('input[name="sectionHeight"]')?.value) || 0,
            width: parseFloat(sectionDiv.querySelector('input[name="sectionWidth"]')?.value) || 0
        };
    } catch (error) { console.error("Error in getSectionData for section:", sectionDiv, error); return {}; }
}

// Forward declaration
let updateTotals;

/** Creates a dynamic Rough Estimate section. */
function createRoughEstimateSection(index) {
    console.log(`Creating section ${index + 1}`);
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section';
    sectionDiv.dataset.index = index;
    sectionDiv.innerHTML = `
      <div class="section-header">
         <span class="section-id">Section ${index + 1}</span>
      </div>
      <label> Door Style: <select name="sectionDoorStyle">${doorStyles.map(s => `<option value="${s}">${s}</option>`).join('')}</select> </label>
      <label> Drawer Style: <select name="sectionDrawerStyle">${drawerStyles.map(s => `<option value="${s}">${s}</option>`).join('')}</select> </label>
      <label> Finish:
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
        <label> Height (in): <input type="number" name="sectionHeight" value="12" step="0.1" required /> </label>
        <label> Width (in): <input type="number" name="sectionWidth" value="12" step="0.1" required /> </label>
      </div>
    `;

    if (index > 0) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button'; removeBtn.textContent = 'Remove'; removeBtn.className = 'remove-button';
      removeBtn.addEventListener('click', () => {
        sectionDiv.remove(); updateSectionIndices(); if (typeof updateTotals === 'function') updateTotals();
      });
      sectionDiv.appendChild(removeBtn);
    }
    sectionDiv.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', () => { if (typeof updateTotals === 'function') updateTotals(); });
      input.addEventListener('input', () => { if (typeof updateTotals === 'function') updateTotals(); });
    });
    return sectionDiv;
}

/** Updates the indices for dynamic Rough Estimate sections. */
function updateSectionIndices() {
    document.querySelectorAll('#sectionsContainer .section').forEach((sec, idx) => {
      sec.dataset.index = idx;
      const sectionIdSpan = sec.querySelector('.section-id');
      if (sectionIdSpan) sectionIdSpan.textContent = `Section ${idx + 1}`;
    });
}

/** Loads pricing settings AND disposal setting from localStorage. */
function loadPricingSettings() {
    // Price setup specific fields
    const pricingFields = [
      'pricePerDoor', 'pricePerDrawer', 'refinishingCostPerSqFt',
      'pricePerLazySusan', 'onSiteMeasuring', 'doorDisposalCost'
    ];
    pricingFields.forEach(fieldName => {
      const input = document.querySelector(`#priceSetupContainer [name="${fieldName}"]`);
      if (input) {
        const savedValue = localStorage.getItem(fieldName);
        if (savedValue !== null) input.value = savedValue;
        else if (input.getAttribute('value')) input.value = input.getAttribute('value');
      }
    });

    // Load disposal setting separately
    const disposalSelect = document.querySelector('#specialFeatures select[name="calculateDisposal"]');
    if (disposalSelect) {
        const savedDisposal = localStorage.getItem('calculateDisposal');
        disposalSelect.value = savedDisposal || 'no'; // Default to 'no' if not saved
    }
    saveCurrentSettings(); // Save initial state including disposal setting
}

/** Saves a setting field's value to localStorage. */
function saveSetting(e) {
    if (e.target.name) {
      localStorage.setItem(e.target.name, e.target.value);
      saveCurrentSettings(); // Update the full saved object
    }
}

/** Helper function to save the current state of price setup inputs AND disposal setting. */
function saveCurrentSettings() {
    const currentSettings = {};
    // Get values from price setup
    document.querySelectorAll('#priceSetupContainer input, #priceSetupContainer select').forEach(input => {
        if (input.name) currentSettings[input.name] = input.value;
    });
    // Get value from disposal dropdown
    const disposalSelect = document.querySelector('#specialFeatures select[name="calculateDisposal"]');
    if (disposalSelect) currentSettings['calculateDisposal'] = disposalSelect.value;

    localStorage.setItem('currentSettings', JSON.stringify(currentSettings)); // Use a different key for combined settings
}


/** Helper function to format currency. */
function formatCurrency(value) {
    const number = Number(value);
    if (isNaN(number)) return '$0.00';
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Helper function to escape HTML */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("script.js: DOMContentLoaded event fired.");

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

    if (!sectionsContainer || !addSectionBtn || !calcForm || !priceSetupContainer || !togglePriceSetupBtn || !clearAllBtn || !resultsDiv || !printBtnContainer) {
        console.error("CRITICAL ERROR: One or more essential HTML elements not found.");
        document.body.innerHTML = '<h1 style="color: red;">Error: Application UI failed to initialize. Please check console.</h1>';
        return;
    }
    console.log("Essential elements references obtained.");

  /** Function to update global totals */
  updateTotals = function() {
        const sections = document.querySelectorAll('#sectionsContainer .section');
        let totalSqFt = 0;
        sections.forEach(sec => {
          const height = parseFloat(sec.querySelector('input[name="sectionHeight"]')?.value) || 0;
          const width = parseFloat(sec.querySelector('input[name="sectionWidth"]')?.value) || 0;
          totalSqFt += (height * width) / 144;
        });
        globalTotalSqFt = totalSqFt;

        const doors0 = parseInt(document.querySelector('input[name="doors_0_36"]')?.value) || 0;
        const doors36 = parseInt(document.querySelector('input[name="doors_36_60"]')?.value) || 0;
        const doors60 = parseInt(document.querySelector('input[name="doors_60_82"]')?.value) || 0;
        globalTotalDoors = doors0 + doors36 + doors60;
        globalTotalDrawers = parseInt(document.querySelector('input[name="numDrawers"]')?.value) || 0;
  };
  console.log("updateTotals function defined.");

  // Load pricing and disposal settings.
  try {
      console.log("Loading settings...");
      loadPricingSettings();
      console.log("Settings loaded.");
  } catch (error) {
      console.error("Error during loadPricingSettings:", error);
  }

  // Attach listeners to relevant inputs/selects for saving state
  try {
      console.log("Attaching saveSetting listeners...");
      document.querySelectorAll(`
          #priceSetupContainer input[type="number"],
          #specialFeatures select[name="calculateDisposal"]
      `).forEach(input => {
          input.addEventListener('change', saveSetting);
          if (input.type === 'number') {
              input.addEventListener('input', saveSetting); // Save number inputs as they type too
          }
      });
      console.log("saveSetting listeners attached.");
  } catch (error) {
      console.error("Error attaching saveSetting listeners:", error);
  }

  // Attach listeners needed for updateTotals
   try {
       console.log("Attaching updateTotals listeners...");
       document.querySelectorAll('#hingeDrilling input[type="number"], #specialFeatures input[type="number"], #specialFeatures select[name="calculateDisposal"]').forEach(input => {
           input.addEventListener('input', updateTotals);
           input.addEventListener('change', updateTotals);
       });
       console.log("updateTotals listeners attached.");
   } catch (error) {
       console.error("Error attaching updateTotals listeners:", error);
   }

  // Price Setup Toggle Logic.
  if (togglePriceSetupBtn && priceSetupContainer) {
      togglePriceSetupBtn.addEventListener('click', () => {
        const isCollapsed = priceSetupContainer.classList.contains('collapsed');
        priceSetupContainer.classList.toggle('collapsed', !isCollapsed); // More concise toggle
        togglePriceSetupBtn.textContent = isCollapsed ? 'Hide' : 'Show';
      });
      console.log("Price Setup toggle listener attached.");
  } else {
      console.error("Price Setup toggle button or container not found.");
  }

  // Toggle Instructions Logic
  if (toggleInstructionsBtn && instructionsDiv) {
      toggleInstructionsBtn.addEventListener('click', () => {
          const isHidden = instructionsDiv.style.display === 'none';
          instructionsDiv.style.display = isHidden ? 'block' : 'none';
          toggleInstructionsBtn.textContent = isHidden ? 'Hide Directions' : 'Show Directions';
      });
      console.log("Instructions toggle listener attached.");
  } else {
      if (!toggleInstructionsBtn) console.warn("Instructions toggle button (#toggleInstructionsBtn) not found.");
  }

  // Initialize sections.
  function initializeSections() {
        console.log("Initializing sections...");
        if (!sectionsContainer) return;
        sectionsContainer.innerHTML = '';
        try {
            for (let i = 0; i < 2; i++) {
              sectionsContainer.appendChild(createRoughEstimateSection(i));
            }
            updateTotals();
            console.log("Sections initialized.");
        } catch (error) { console.error("Error during initializeSections:", error); }
  }
  initializeSections();

  // Add Section Button.
  if(addSectionBtn){
      addSectionBtn.addEventListener('click', () => {
        console.log("Add section button clicked.");
        try {
            const index = sectionsContainer.children.length;
            sectionsContainer.appendChild(createRoughEstimateSection(index));
            updateTotals();
        } catch (error) { console.error("Error executing Add Section click handler:", error); }
      });
      console.log("Add Section listener attached.");
  } else { console.error("Add Section button not found."); }

  // Clear All button functionality.
  if(clearAllBtn){
      clearAllBtn.addEventListener('click', () => {
        console.log("Clear All button clicked.");
        try {
            // Reset forms excluding price setup
            document.querySelectorAll('#roughEstimateContainer, #otherPartsContainer').forEach(container => {
                const form = container.closest('form'); // Find the parent form if needed
                container.querySelectorAll('input, select').forEach(el => {
                    if (el.closest('#priceSetupContainer')) return; // Skip price setup
                    if (el.type === 'number') el.value = el.getAttribute('value') || '0';
                    else if (el.type === 'text') el.value = '';
                    else if (el.tagName === 'SELECT') {
                         // Explicitly set disposal to 'no'
                         if(el.name === 'calculateDisposal') {
                             el.value = 'no';
                         } else {
                             el.selectedIndex = 0;
                         }
                    }
                });
            });

            // Explicitly reset counts
            document.querySelectorAll('#hingeDrilling input[type="number"]').forEach(input => { input.value = '0'; });
            document.querySelectorAll('#specialFeatures input[type="number"]').forEach(input => { input.value = '0'; });

            initializeSections(); // Re-create default sections

            // Restore Price Setup values only
            const currentSettings = JSON.parse(localStorage.getItem('currentSettings') || '{}');
            document.querySelectorAll('#priceSetupContainer input, #priceSetupContainer select').forEach(input => {
                if (input.name && currentSettings.hasOwnProperty(input.name)) {
                    input.value = currentSettings[input.name];
                } else if (input.name) {
                    const defaultValue = input.getAttribute('value');
                    input.value = defaultValue || (input.tagName === 'SELECT' ? 'no' : '');
                }
            });
            // Ensure the disposal dropdown in Special Features is explicitly reset, as it's not restored above
            const disposalSelect = document.querySelector('#specialFeatures select[name="calculateDisposal"]');
            if (disposalSelect) disposalSelect.value = 'no';


            priceSetupContainer.classList.remove('collapsed');
            togglePriceSetupBtn.textContent = 'Hide';
            if (instructionsDiv && toggleInstructionsBtn) {
                instructionsDiv.style.display = 'none';
                toggleInstructionsBtn.textContent = 'Show Directions';
            }
            resultsDiv.innerHTML = '';
            if (printBtnContainer) printBtnContainer.style.display = 'none';

            updateTotals(); // Update totals based on reset values
            console.log("Clear All finished.");
        } catch (error) { console.error("Error during Clear All execution:", error); }
      });
      console.log("Clear All listener attached.");
  } else { console.error("Clear All button not found."); }


  // On form submit
  if(calcForm){
      calcForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Form submitted.");
        try {
            updateTotals();
            console.log("Totals updated for submit.");

            // Build Payload
            const sections = [];
            document.querySelectorAll('#sectionsContainer .section').forEach(sec => {
                sections.push(getSectionData(sec));
            });
            const formData = new FormData(e.target);
            // --- CORRECTED PAYLOAD STRUCTURE ---
            const payload = {
              sections: sections,
              part2: { // Data from 'Piece Count' section
                numDrawers: parseInt(formData.get('numDrawers')) || 0,
                doors_0_36: parseInt(formData.get('doors_0_36')) || 0,
                doors_36_60: parseInt(formData.get('doors_36_60')) || 0,
                doors_60_82: parseInt(formData.get('doors_60_82')) || 0,
                lazySusanQty: parseInt(formData.get('lazySusanQty')) || 0,
                totalDoors: globalTotalDoors // Send calculated actual door count
              },
              part3: { // Data from 'Special Features' section
                customPaintQty: parseInt(formData.get('customPaintQty')) || 0,
                calculateDisposal: formData.get('calculateDisposal') || 'no' // Disposal flag HERE
              },
              priceSetup: { // Data from 'Piece & Install Pricing' section
                pricePerDoor: parseFloat(formData.get('pricePerDoor')) || 0,
                pricePerDrawer: parseFloat(formData.get('pricePerDrawer')) || 0,
                refinishingCostPerSqFt: parseFloat(formData.get('refinishingCostPerSqFt')) || 0,
                pricePerLazySusan: parseFloat(formData.get('pricePerLazySusan')) || 0,
                onSiteMeasuring: parseFloat(formData.get('onSiteMeasuring')) || 0,
                doorDisposalCost: parseFloat(formData.get('doorDisposalCost')) || 0,
                // Disposal flag now comes from part3
                onSiteMeasuringSqFt: globalTotalSqFt // Send calculated SqFt
              }
            };
            // --- END PAYLOAD CORRECTION ---

            console.log("Payload constructed:", JSON.stringify(payload, null, 2));

            resultsDiv.innerHTML = '<p>Calculating...</p>';
            if(printBtnContainer) printBtnContainer.style.display = 'none';

            const response = await fetch('/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log("Fetch response status:", response.status);

            // Improved Body Reading and Error Handling
            let responseData = {};
            let responseBodyText = '';
            try {
                const clonedResponse = response.clone(); // Clone to read text first
                responseBodyText = await clonedResponse.text(); // Read text first
                if (response.ok) {
                    responseData = JSON.parse(responseBodyText); // Parse JSON only if OK
                }
            } catch (jsonError) {
                console.warn("Could not parse response as JSON:", jsonError);
                if (response.ok) { // If status was ok, but JSON failed, it's a server format error
                     responseData = { error: `Invalid JSON response from server (Status: ${response.status}). Body: ${responseBodyText}` };
                     // Throw this as it indicates success status but bad data
                     const formatError = new Error(responseData.error);
                     formatError.status = response.status;
                     throw formatError;
                }
                // If status was not ok and parsing failed, use text later
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
            if (err.status === 404) displayErrorMessage = `Error: Calculation endpoint not found (404). Please check server configuration/deployment. (${err.message})`;
            else if (err.status) displayErrorMessage = `Error: Server returned status ${err.status}. (${err.message})`;

            // Ensure escapeHTML function exists before using
            const escapedMsg = typeof escapeHTML === 'function' ? escapeHTML(displayErrorMessage) : displayErrorMessage;
            resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error Calculating Estimate:</strong></p><p>${escapedMsg}</p></div>`;
            if(printBtnContainer) printBtnContainer.style.display = 'none';
        }
      });
      console.log("Submit listener attached.");
  } else { console.error("Calculate form not found."); }


  // --- displayResults function (keep mostly as is, ensure data access is safe) ---
  function displayResults(resultData) {
    console.log("Displaying results for:", resultData);
     if (!resultData || typeof resultData !== 'object' || resultData.error) {
        const errorMsg = resultData?.error || 'Invalid or missing data received from server.';
        const escapedError = typeof escapeHTML === 'function' ? escapeHTML(errorMsg) : errorMsg;
        resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error processing results:</strong></p><p>${escapedError}</p></div>`;
        if (printBtnContainer) printBtnContainer.style.display = 'none';
        return;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Safely access nested properties with defaults
    const specialFeatures = resultData.specialFeatures || {};
    const installation = resultData.installation || {};
    const part2 = resultData.part2 || {};
    const part3 = resultData.part3 || {}; // Need part3 for disposal flag
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
    const lazySusanQty = part2.lazySusanQty ?? 0;
    const lazySusanSurchargeVal = lazySusanQty * 50;

    const costToInstaller = formatCurrency(resultData.costToInstaller);
    const profitMargin = formatCurrency(resultData.profitMargin);
    const actualTotalDoors = part2.totalDoors ?? 0;
    const displayedTotalDoors = actualTotalDoors + (lazySusanQty * 2);
    const totalDrawers = part2.numDrawers ?? 0;
    const hingeCount = resultData.hingeCount ?? 'N/A';
    const doorsForDisposal = resultData.doorsForDisposal ?? 0;
    const drawersForDisposal = resultData.drawersForDisposal ?? 0; // Get from backend
    const lazySusansForDisposal = resultData.lazySusansForDisposal ?? 0;
    const calculateDisposalFlag = part3.calculateDisposal === 'yes'; // Check flag from part3


    let html = `
      <div class="invoice">
        <div class="invoice-header">
           <!-- Removed logo from here, keep it in main header -->
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
            ${lazySusanSurchargeVal > 0 ? `<tr><td class="table-label">Lazy Susan Surcharge ($50 each)</td><td class="table-value">${formatCurrency(lazySusanSurchargeVal)}</td></tr>` : ''}
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
				 <tr><td>Total Drawers:</td><td>${totalDrawers}</td></tr>
                 <tr><td>Total Doors:</td><td>${displayedTotalDoors}</td></tr>
				 <tr><td>Number of Lazy Susans:</td><td>${lazySusanQty}</td></tr>
                 <tr><td>Hinge Count:</td><td>${hingeCount}</td></tr>
				 <tr></tr>
				 <tr></tr>
                 <tr><td>Installation - Doors:</td><td>${formatCurrency(installation.doorInstall)}</td></tr>
                 <tr><td>Installation - Drawers:</td><td>${formatCurrency(installation.drawerInstall)}</td></tr>
                 <tr><td>Installation - Lazy Susans:</td><td>${formatCurrency(installation.lazySusanInstall)}</td></tr>
				 <tr></tr>
				 <tr></tr>
                 ${lazySusanSurchargeVal > 0 ? `<tr><td>Lazy Susan Surcharge Applied:</td><td>${formatCurrency(lazySusanSurchargeVal)}</td></tr>` : ''}
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


   console.log("script.js: DOMContentLoaded setup complete."); // Final Debug Log

}); // End DOMContentLoaded

console.log("script.js: File finished parsing."); // Log file end

// --- END OF FILE script.js ---Attached are my updated build files. I have edited the CSS as well to make the app neumorphic. Please check these updates and return the code.