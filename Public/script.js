// script.js

// Define door and drawer style arrays.
const doorStyles = [
  "Shaker",
  "Slab",
  "Chamfer",
  "Savannah",
  "Beaded",
  "Stepped",
  "Ruth",
  "Maisie",
  "Mavis",
  "Dorothy",
  "Raised Panel",
  "Split Shaker",
  "Jean",
  "Nora",
  "Amelia",
  "Millie",
  "Glass",
  "Frances",
  "Alice",
  "Mabel",
  "Bessie",
  "Winona",
  "Eleanor",
  "Georgia"
];
const drawerStyles = doorStyles.filter(style =>
  !["Glass", "Georgia", "Split Shaker", "Winona", "Bessie", "Nora"].includes(style)
);

// Global variables to hold computed installation details.
let globalTotalSqFt = 0;
let globalTotalDoors = 0;
let globalTotalDrawers = 0;
let globalDoorInstallCost = 0;
let globalDrawerInstallCost = 0;
let globalLazySusanInstallCost = 0;

/**
 * Retrieves data from a dynamic Rough Estimate section.
 * @param {HTMLElement} sectionDiv - The section element.
 * @returns {Object} Data object.
 */
function getSectionData(sectionDiv) {
  return {
    doorStyle: sectionDiv.querySelector('select[name="sectionDoorStyle"]').value,
    drawerStyle: sectionDiv.querySelector('select[name="sectionDrawerStyle"]').value,
    finish: sectionDiv.querySelector('select[name="sectionFinish"]').value,
    height: parseFloat(sectionDiv.querySelector('input[name="sectionHeight"]').value) || 0,
    width: parseFloat(sectionDiv.querySelector('input[name="sectionWidth"]').value) || 0
  };
}

// Forward declaration of updateTotals
let updateTotals;

/**
 * Creates a dynamic Rough Estimate section.
 * @param {number} index - The section index.
 * @returns {HTMLElement} The created section element.
 */
function createRoughEstimateSection(index) {
  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'section';
  sectionDiv.dataset.index = index;
  sectionDiv.innerHTML = `
    <span class="section-id">Section ${index + 1}</span>
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
  `; // Wrapped height/width in div for better styling potential

  if (index > 0) {
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-button'; // Apply class for styling
    removeBtn.addEventListener('click', () => {
      sectionDiv.remove();
      updateSectionIndices();
      if (typeof updateTotals === 'function') {
        updateTotals(); // Recalculate totals when a section is removed
      }
    });
    sectionDiv.appendChild(removeBtn);
  }

  // Add event listeners to recalculate totals when section inputs change
  sectionDiv.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('change', () => {
         if (typeof updateTotals === 'function') updateTotals();
    });
    input.addEventListener('input', () => { // Also listen for input event for numbers
         if (typeof updateTotals === 'function') updateTotals();
    });
  });

  return sectionDiv;
}

/**
 * Updates the indices for dynamic Rough Estimate sections.
 */
function updateSectionIndices() {
  const sections = document.querySelectorAll('#sectionsContainer .section');
  sections.forEach((sec, idx) => {
    sec.dataset.index = idx;
    const sectionId = sec.querySelector('.section-id');
    if (sectionId) sectionId.textContent = `Section ${idx + 1}`;
  });
}

/**
 * Loads pricing settings from localStorage and updates the Price Setup fields.
 */
function loadPricingSettings() {
  const pricingFields = [
    'pricePerDoor',
    'pricePerDrawer',
    'refinishingCostPerSqFt',
    'pricePerLazySusan',
    'onSiteMeasuring',
    'doorDisposalCost'
  ];
  pricingFields.forEach(fieldName => {
    const input = document.querySelector(`input[name="${fieldName}"]`);
    if (input) {
      const savedValue = localStorage.getItem(fieldName);
      if (savedValue !== null && savedValue !== "") {
        input.value = savedValue;
      } else {
          const defaultValue = input.getAttribute('value');
          if (defaultValue !== null) {
              input.value = defaultValue;
              localStorage.setItem(fieldName, defaultValue);
          }
      }
    }
  });
  saveCurrentPriceSetupValues();
}

/**
 * Saves a pricing field's value to localStorage.
 * @param {Event} e - The event object.
 */
function savePricingSetting(e) {
  localStorage.setItem(e.target.name, e.target.value);
  saveCurrentPriceSetupValues();
}

/** Helper function to save the current state of price setup inputs for clearAll restoration */
function saveCurrentPriceSetupValues() {
    const priceSetupValues = {};
    document.querySelectorAll('#priceSetupContainer input').forEach(input => {
        priceSetupValues[input.name] = input.value;
    });
    localStorage.setItem('priceSetupValues', JSON.stringify(priceSetupValues));
}

// Helper function to format currency
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
  const priceSetupContainer = document.getElementById('priceSetupContainer'); // Get the container
  const togglePriceSetupBtn = document.getElementById('togglePriceSetupBtn');
  const priceSetupContent = document.getElementById('priceSetupContent'); // Inner content div
  const clearAllBtn = document.getElementById('clearAllBtn');
  const resultsDiv = document.getElementById('results');
  const printBtnContainer = document.getElementById('printButtonContainer');

  /**
   * Function to update global totals based on form inputs
   * and compute preliminary installation details.
   */
  updateTotals = function() { // Assign to the previously declared variable
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

    const pricePerDoor = parseFloat(document.querySelector('input[name="pricePerDoor"]').value) || 0;
    const pricePerDrawer = parseFloat(document.querySelector('input[name="pricePerDrawer"]').value) || 0;
    const pricePerLazySusan = parseFloat(document.querySelector('input[name="pricePerLazySusan"]').value) || 0;

    globalDoorInstallCost = globalTotalDoors * pricePerDoor;
    globalDrawerInstallCost = globalTotalDrawers * pricePerDrawer;
    const lazySusanQty = parseInt(document.querySelector('input[name="lazySusanQty"]').value) || 0;
    globalLazySusanInstallCost = lazySusanQty * pricePerLazySusan;
  };

  // Load pricing settings from localStorage.
  loadPricingSettings();

  // Attach change listeners to pricing input fields.
  const pricingFields = [
    'pricePerDoor',
    'pricePerDrawer',
    'refinishingCostPerSqFt',
    'pricePerLazySusan',
    'onSiteMeasuring',
    'doorDisposalCost'
  ];
  pricingFields.forEach(fieldName => {
    const input = document.querySelector(`input[name="${fieldName}"]`);
    if (input) {
      input.addEventListener('change', savePricingSetting);
      input.addEventListener('input', savePricingSetting);
    }
  });

  // --- MODIFIED Price Setup Toggle Logic ---
  togglePriceSetupBtn.addEventListener('click', () => {
    const isCollapsed = priceSetupContainer.classList.contains('collapsed');

    if (isCollapsed) {
        // Expand
        priceSetupContainer.classList.remove('collapsed');
        // No need to explicitly show priceSetupContent, CSS handles it
        togglePriceSetupBtn.textContent = 'Hide Prices';
    } else {
        // Collapse
        priceSetupContainer.classList.add('collapsed');
        // priceSetupContent display is handled by CSS within .collapsed
        togglePriceSetupBtn.textContent = 'Show Prices';
    }
  });

  // Initialize with 2 Rough Estimate sections.
  function initializeSections() {
    sectionsContainer.innerHTML = '';
    for (let i = 0; i < 2; i++) {
      sectionsContainer.appendChild(createRoughEstimateSection(i));
    }
    updateTotals();
  }
  initializeSections();

  addSectionBtn.addEventListener('click', () => {
    const index = sectionsContainer.children.length;
    sectionsContainer.appendChild(createRoughEstimateSection(index));
    updateTotals();
  });


  // Attach event listeners to update totals on input change for non-section inputs.
   document.querySelectorAll('#hingeDrilling input, #priceSetupContent input, #specialFeatures input, #disposalCost input').forEach(input => {
       input.addEventListener('input', updateTotals);
       input.addEventListener('change', updateTotals);
   });


  // Clear All button functionality.
  clearAllBtn.addEventListener('click', () => {
    // Reset form elements excluding Price Setup
    document.querySelectorAll('#roughEstimateContainer, #otherPartsContainer').forEach(container => {
        container.querySelectorAll('input, select').forEach(el => {
            if (el.tagName === 'INPUT') {
                const type = el.type.toLowerCase();
                if (type === 'number') el.value = el.getAttribute('value') || '0';
                else if (type === 'text') el.value = '';
            } else if (el.tagName === 'SELECT') {
                el.selectedIndex = 0;
            }
        });
    });

    // Explicitly reset counts to 0
     document.querySelector('input[name="numDrawers"]').value = "0";
     document.querySelector('input[name="doors_0_36"]').value = "0";
     document.querySelector('input[name="doors_36_60"]').value = "0";
     document.querySelector('input[name="doors_60_82"]').value = "0";
     document.querySelector('input[name="lazySusanQty"]').value = "0";
     document.querySelector('input[name="customPaintQty"]').value = "0";
     document.querySelector('input[name="doorDisposalQty"]').value = "0";
     document.querySelector('input[name="lazySusanDisposalQty"]').value = "0";

    // Reinitialize dynamic sections
    initializeSections();

    // Restore Price Setup values from saved object
    const priceSetupValues = JSON.parse(localStorage.getItem('priceSetupValues') || '{}');
    document.querySelectorAll('#priceSetupContainer input').forEach(input => {
        input.value = priceSetupValues[input.name] !== undefined ? priceSetupValues[input.name] : (input.getAttribute('value') || '');
    });

    // Ensure Price Setup is expanded after clear
    priceSetupContainer.classList.remove('collapsed');
    togglePriceSetupBtn.textContent = 'Hide Prices';

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
        sections.push({
            doorStyle: sec.querySelector('select[name="sectionDoorStyle"]').value,
            drawerStyle: sec.querySelector('select[name="sectionDrawerStyle"]').value,
            finish: sec.querySelector('select[name="sectionFinish"]').value,
            height: parseFloat(sec.querySelector('input[name="sectionHeight"]').value) || 0,
            width: parseFloat(sec.querySelector('input[name="sectionWidth"]').value) || 0
        });
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
        customPaintQty: parseInt(formData.get('customPaintQty')) || 0
      },
      part5: {
        totalSqFt: globalTotalSqFt
      },
      priceSetup: {
        pricePerDoor: parseFloat(formData.get('pricePerDoor')) || 0,
        pricePerDrawer: parseFloat(formData.get('pricePerDrawer')) || 0,
        refinishingCostPerSqFt: parseFloat(formData.get('refinishingCostPerSqFt')) || 0,
        pricePerLazySusan: parseFloat(formData.get('pricePerLazySusan')) || 0,
        onSiteMeasuring: parseFloat(formData.get('onSiteMeasuring')) || 0,
        doorDisposalCost: parseFloat(formData.get('doorDisposalCost')) || 0,
        onSiteMeasuringSqFt: globalTotalSqFt
      },
      disposal: {
        doorDisposalQty: parseInt(formData.get('doorDisposalQty')) || 0,
        lazySusanDisposalQty: parseInt(formData.get('lazySusanDisposalQty')) || 0
      }
    };

    try {
      resultsDiv.textContent = 'Calculating...';
      const response = await fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) errorMsg += ` - ${errorData.error}`;
                else errorMsg += ` - Server error details unavailable.`;
            } catch (e) { errorMsg += ` - Could not parse error response.`; }
          throw new Error(errorMsg);
      }
      const resultData = await response.json();
      displayResults(resultData);
       printBtnContainer.style.display = 'block';
    } catch (err) {
      resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error Calculating Estimate:</strong></p><p>${err.message}</p></div>`;
       printBtnContainer.style.display = 'none';
       console.error("Calculation Error Full:", err);
    }
  });

  // Display results in a professional invoice style.
  function displayResults(resultData) {
    if (resultData.error) {
      resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error from Server:</strong></p><p>${resultData.error}</p></div>`;
      printBtnContainer.style.display = 'none';
      return;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const overallTotal = formatCurrency(resultData.overallTotal);
    const allSectionsCost = formatCurrency(resultData.doorCostTotal);
    const hingeCost = formatCurrency(resultData.hingeCost);
    const refinishingCost = formatCurrency(resultData.refinishingCost);
    const measuringCost = formatCurrency(resultData.measuringCost);
    const disposalCostVal = resultData.disposalCost || 0;
    const disposalCost = formatCurrency(disposalCostVal);
    const customPaintCostVal = resultData.specialFeatures?.customPaintCost || 0;
    const customPaintCost = formatCurrency(customPaintCostVal);
    const totalInstallCost = formatCurrency(resultData.installation?.totalInstall);

    const costToInstaller = formatCurrency(resultData.costToInstaller);
    const profitMargin = formatCurrency(resultData.profitMargin);
    const totalDoors = resultData.part2?.totalDoors ?? globalTotalDoors;
    const totalDrawers = resultData.part2?.numDrawers ?? globalTotalDrawers;
    const hingeCount = resultData.hingeCount ?? 'N/A';

    let html = `
      <div class="invoice">
        <div class="invoice-header">
          <h1>Fill Project Estimate</h1>
          <p>Date: ${dateStr}</p>
        </div>
        <hr class="invoice-hr">
        <h2>Summary of Charges</h2>
        <table class="summary-table">
          <tbody>
            <tr><td class="table-label">Door & Drawer Fronts (All Sections)</td><td class="table-value">${allSectionsCost}</td></tr>
            <tr><td class="table-label">Hinge Drilling</td><td class="table-value">${hingeCost}</td></tr>
            ${customPaintCostVal > 0 ? `<tr><td class="table-label">Custom Paint</td><td class="table-value">${customPaintCost}</td></tr>` : ''}
            <tr><td class="table-label">Refinishing (${globalTotalSqFt.toFixed(2)} sq ft)</td><td class="table-value">${refinishingCost}</td></tr>
            <tr><td class="table-label">On-Site Measuring</td><td class="table-value">${measuringCost}</td></tr>
            <tr><td class="table-label">Installation (Doors, Drawers, Lazy Susans)</td><td class="table-value">${totalInstallCost}</td></tr>
            ${disposalCostVal > 0 ? `<tr><td class="table-label">Disposal</td><td class="table-value">${disposalCost}</td></tr>` : ''}
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
                 <tr><td>Total Doors:</td><td>${totalDoors}</td></tr>
                 <tr><td>Total Drawers:</td><td>${totalDrawers}</td></tr>
                 <tr><td>Hinge Count:</td><td>${hingeCount}</td></tr>
                 <tr><td>Installation - Doors:</td><td>${formatCurrency(resultData.installation?.doorInstall)}</td></tr>
                 <tr><td>Installation - Drawers:</td><td>${formatCurrency(resultData.installation?.drawerInstall)}</td></tr>
                 <tr><td>Installation - Lazy Susans:</td><td>${formatCurrency(resultData.installation?.lazySusanInstall)}</td></tr>
                 <tr><td>Cost To Installer (Materials + Hinge Drilling):</td><td>${costToInstaller}</td></tr>
                 <tr><td>Profit Margin:</td><td>${profitMargin}</td></tr>
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

  // Attach print functionality
   const printEstimateBtn = document.getElementById('printEstimate');
   if (printEstimateBtn) {
       printEstimateBtn.addEventListener('click', () => window.print());
   }

   // Conditional Printing Logic
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