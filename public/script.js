// script.js

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
    return {
        doorStyle: sectionDiv.querySelector('select[name="sectionDoorStyle"]').value,
        drawerStyle: sectionDiv.querySelector('select[name="sectionDrawerStyle"]').value,
        finish: sectionDiv.querySelector('select[name="sectionFinish"]').value,
        height: parseFloat(sectionDiv.querySelector('input[name="sectionHeight"]').value) || 0,
        width: parseFloat(sectionDiv.querySelector('input[name="sectionWidth"]').value) || 0
      };
 }

// Forward declaration
let updateTotals;

/** Creates a dynamic Rough Estimate section. */
function createRoughEstimateSection(index) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section';
    sectionDiv.dataset.index = index;

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

    sectionDiv.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', () => {
           if (typeof updateTotals === 'function') updateTotals();
      });
      input.addEventListener('input', () => {
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
      'pricePerDoor', 'pricePerDrawer', 'refinishingCostPerSqFt',
      'pricePerLazySusan', 'onSiteMeasuring', 'doorDisposalCost',
      'calculateDisposal' // Include the dropdown state
    ];
    pricingFields.forEach(fieldName => {
      const inputs = document.querySelectorAll(`[name="${fieldName}"]`); // Use querySelectorAll
      inputs.forEach(input => { // Iterate over potential matches
          if (input) {
              const savedValue = localStorage.getItem(fieldName);
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
          }
      });
    });
    saveCurrentPriceSetupValues(); // Save initial state after loading
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
    // Query ALL inputs/selects in relevant containers
    document.querySelectorAll('#priceSetupContainer input, #priceSetupContainer select, #specialFeatures select').forEach(input => {
        if (input.name) {
            priceSetupValues[input.name] = input.value;
        }
    });
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


document.addEventListener('DOMContentLoaded', () => {
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


  /** Function to update global totals (only counts needed for payload). */
  updateTotals = function() {
        const sections = document.querySelectorAll('#sectionsContainer .section');
        let totalSqFt = 0;
        sections.forEach(sec => {
          const height = parseFloat(sec.querySelector('input[name="sectionHeight"]').value) || 0;
          const width = parseFloat(sec.querySelector('input[name="sectionWidth"]').value) || 0;
          totalSqFt += (height * width) / 144;
        });
        globalTotalSqFt = totalSqFt;

        const doors0 = parseInt(document.querySelector('input[name="doors_0_36"]').value) || 0;
        const doors36 = parseInt(document.querySelector('input[name="doors_36_60"]').value) || 0;
        const doors60 = parseInt(document.querySelector('input[name="doors_60_82"]').value) || 0;
        globalTotalDoors = doors0 + doors36 + doors60;

        globalTotalDrawers = parseInt(document.querySelector('input[name="numDrawers"]').value) || 0;
  };

  // Load pricing settings.
  loadPricingSettings();

  // Attach listeners to pricing input fields & select
  document.querySelectorAll('#priceSetupContainer input, #priceSetupContainer select, #specialFeatures select').forEach(input => {
    input.addEventListener('change', savePricingSetting);
    if (input.type === 'number') input.addEventListener('input', savePricingSetting);
  });


  // Price Setup Toggle Logic.
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
  } else {
      console.error("Instructions toggle button or div not found.");
  }

  // Initialize sections.
  function initializeSections() {
        sectionsContainer.innerHTML = '';
        for (let i = 0; i < 2; i++) {
          sectionsContainer.appendChild(createRoughEstimateSection(i));
        }
        updateTotals();
  }
  initializeSections();

  // Add Section Button.
  addSectionBtn.addEventListener('click', () => {
    const index = sectionsContainer.children.length;
    sectionsContainer.appendChild(createRoughEstimateSection(index));
    updateTotals();
  });

  // Attach listeners to update totals.
   document.querySelectorAll('#hingeDrilling input, #specialFeatures input').forEach(input => {
       input.addEventListener('input', updateTotals);
       input.addEventListener('change', updateTotals);
   });


  // Clear All button functionality.
  clearAllBtn.addEventListener('click', () => {
    // Reset non-Price Setup form elements
    document.querySelectorAll('#roughEstimateContainer, #otherPartsContainer').forEach(container => {
        container.querySelectorAll('input, select').forEach(el => {
            if (el.closest('#priceSetupContainer') || el.closest('#specialFeatures')) return; // Skip price setup and special features

            if (el.tagName === 'INPUT') {
                const type = el.type.toLowerCase();
                if (type === 'number') el.value = el.getAttribute('value') || '0';
                else if (type === 'text') el.value = '';
            } else if (el.tagName === 'SELECT') {
                el.selectedIndex = 0;
            }
        });
    });

    // Explicitly reset counts in their specific containers
    document.querySelectorAll('#hingeDrilling input').forEach(input => {
        input.value = input.getAttribute('value') || '0';
    });
    document.querySelectorAll('#specialFeatures input[type="number"]').forEach(input => {
         input.value = input.getAttribute('value') || '0';
    });
     // Reset disposal dropdown in special features explicitly
     const disposalSelect = document.querySelector('#specialFeatures select[name="calculateDisposal"]');
     if (disposalSelect) disposalSelect.value = 'no';


    // Reinitialize dynamic sections
    initializeSections();

    // Restore Price Setup values (disposal dropdown handled above)
    const priceSetupValues = JSON.parse(localStorage.getItem('priceSetupValues') || '{}');
    document.querySelectorAll('#priceSetupContainer input, #priceSetupContainer select').forEach(input => {
        let defaultValue = '';
        if (input.tagName === 'SELECT') { // This shouldn't be hit anymore here, but safe fallback
            defaultValue = 'no';
        } else {
            defaultValue = input.getAttribute('value') || '';
        }
        input.value = priceSetupValues[input.name] !== undefined ? priceSetupValues[input.name] : defaultValue;
    });


    // Ensure Price Setup is expanded
    priceSetupContainer.classList.remove('collapsed');
    togglePriceSetupBtn.textContent = 'Hide';

    // Reset Instructions Toggle
    if (instructionsDiv && toggleInstructionsBtn) {
        instructionsDiv.style.display = 'none';
        toggleInstructionsBtn.textContent = 'Show Directions';
    }

    // Clear results
    resultsDiv.innerHTML = '';
    printBtnContainer.style.display = 'none';

    updateTotals();
  });


  // On form submit, build the payload and send it.
  calcForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    updateTotals();

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
      part3: {
        customPaintQty: parseInt(formData.get('customPaintQty')) || 0,
        calculateDisposal: formData.get('calculateDisposal') || 'no'
      },
      priceSetup: {
        pricePerDoor: parseFloat(formData.get('pricePerDoor')) || 0,
        pricePerDrawer: parseFloat(formData.get('pricePerDrawer')) || 0,
        refinishingCostPerSqFt: parseFloat(formData.get('refinishingCostPerSqFt')) || 0,
        pricePerLazySusan: parseFloat(formData.get('pricePerLazySusan')) || 0,
        onSiteMeasuring: parseFloat(formData.get('onSiteMeasuring')) || 0,
        doorDisposalCost: parseFloat(formData.get('doorDisposalCost')) || 0,
        onSiteMeasuringSqFt: globalTotalSqFt
      }
    };

    // console.log("Sending Payload:", JSON.stringify(payload, null, 2)); // Debugging: Log payload

    try {
      resultsDiv.textContent = 'Calculating...';
      const response = await fetch('/calculate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });

      // Log raw response status for debugging
      // console.log("Response Status:", response.status, response.statusText);

      if (!response.ok) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
              const errorData = await response.json(); // Try to get JSON error
              if (errorData && errorData.error) errorMsg += ` - ${errorData.error}`;
              else errorMsg += ` - Server error details unavailable.`;
          }
          catch (e) {
              // If response is not JSON (e.g., plain text error)
              const textError = await response.text();
              errorMsg += ` - Server response: ${textError || 'No response body'}`;
           }
        throw new Error(errorMsg);
      }

      const resultData = await response.json();
      // console.log("Received Result:", resultData); // Debugging: Log result
      displayResults(resultData);
      printBtnContainer.style.display = 'block';

    } catch (err) {
      resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error Calculating Estimate:</strong></p><p>${err.message}</p></div>`;
      printBtnContainer.style.display = 'none';
      console.error("Calculation Fetch/Process Error:", err); // Log more specific error location
    }
  });

  // Display results in a professional invoice style.
  function displayResults(resultData) {
    // Add extra check for resultData itself
    if (!resultData || typeof resultData !== 'object') {
        console.error("Invalid resultData received:", resultData);
        resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error:</strong></p><p>Received invalid response format from server.</p></div>`;
        printBtnContainer.style.display = 'none';
        return;
    }
    if (resultData.error) {
        resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error from Server:</strong></p><p>${resultData.error}</p></div>`;
        printBtnContainer.style.display = 'none';
        return;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Provide fallbacks for potentially missing nested objects
    const specialFeatures = resultData.specialFeatures || {};
    const installation = resultData.installation || {};
    const part2 = resultData.part2 || {};
    const part3 = resultData.part3 || {};
    const priceSetup = resultData.priceSetup || {};

    // Main Summary Values
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

    // Internal Details Values
    const costToInstaller = formatCurrency(resultData.costToInstaller);
    const profitMargin = formatCurrency(resultData.profitMargin);
    const actualTotalDoors = part2.totalDoors ?? 0;
    const lazySusanQty = part2.lazySusanQty ?? 0;
    const displayedTotalDoors = actualTotalDoors + (lazySusanQty * 2);
    const totalDrawers = part2.numDrawers ?? 0;
    const hingeCount = resultData.hingeCount ?? 'N/A';
    const doorsForDisposal = resultData.doorsForDisposal ?? 0;
    const drawersForDisposal = resultData.drawersForDisposal ?? 0;
    const lazySusansForDisposal = resultData.lazySusansForDisposal ?? 0;
    const calculateDisposalFlag = part3.calculateDisposal === 'yes';

    let html = `
      <div class="invoice">
        <div class="invoice-header">
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

    const toggleBtn = document.getElementById('toggleDetailsBtn');
    const detailsDiv = document.getElementById('internalDetails');
    if (toggleBtn && detailsDiv) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = detailsDiv.style.display === 'none';
            detailsDiv.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Hide Internal Details' : 'Show Internal Details';
        });
    }
    printBtnContainer.style.display = 'block';
  }

  // Attach print functionality.
   const printEstimateBtn = document.getElementById('printEstimate');
   if (printEstimateBtn) {
       printEstimateBtn.addEventListener('click', () => window.print());
   }

   // Conditional Printing Logic.
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

}); // End DOMContentLoaded