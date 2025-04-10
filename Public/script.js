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
    <label>
      Height (in):
      <input type="number" name="sectionHeight" value="12" step="0.1" required />
    </label>
    <label class="half-width">
      Width (in):
      <input type="number" name="sectionWidth" value="12" step="0.1" required />
    </label>
  `;
  
  if (index > 0) {
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.style.backgroundColor = 'red';
    removeBtn.style.color = 'white';
    removeBtn.style.borderRadius = '1px';
    removeBtn.style.marginTop = '0.5em';
    removeBtn.style.marginLeft = '4.8em';
    removeBtn.addEventListener('click', () => {
      sectionDiv.remove();
      updateSectionIndices();
    });
    sectionDiv.appendChild(removeBtn);
  }
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
      if (savedValue !== null) {
        input.value = savedValue;
      }
    }
  });
}

/**
 * Saves a pricing field's value to localStorage.
 * @param {Event} e - The event object.
 */
function savePricingSetting(e) {
  localStorage.setItem(e.target.name, e.target.value);
}

document.addEventListener('DOMContentLoaded', () => {
  const sectionsContainer = document.getElementById('sectionsContainer');
  const addSectionBtn = document.getElementById('addSectionBtn');
  const calcForm = document.getElementById('calcForm');
  const togglePriceSetupBtn = document.getElementById('togglePriceSetupBtn');
  const priceSetupContent = document.getElementById('priceSetupContent');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
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
    }
  });
  
  // Price Setup Toggle: only hide/show the inner content.
  togglePriceSetupBtn.addEventListener('click', () => {
    if (priceSetupContent.style.display === 'none' || priceSetupContent.style.display === '') {
      priceSetupContent.style.display = 'block';
      togglePriceSetupBtn.textContent = 'Hide Price Setup';
    } else {
      priceSetupContent.style.display = 'none';
      togglePriceSetupBtn.textContent = 'Show Price Setup';
    }
  });
  
  // Initialize with 2 Rough Estimate sections.
  function initializeSections() {
    sectionsContainer.innerHTML = '';
    for (let i = 0; i < 2; i++) {
      sectionsContainer.appendChild(createRoughEstimateSection(i));
    }
  }
  initializeSections();
  
  addSectionBtn.addEventListener('click', () => {
    const index = sectionsContainer.children.length;
    sectionsContainer.appendChild(createRoughEstimateSection(index));
  });
  
  // Function to update totals and compute installation details.
  const updateTotals = () => {
    // Compute total square footage from dynamic sections.
    const sections = document.querySelectorAll('#sectionsContainer .section');
    let totalSqFt = 0;
    sections.forEach(sec => {
      const height = parseFloat(sec.querySelector('input[name="sectionHeight"]').value) || 0;
      const width = parseFloat(sec.querySelector('input[name="sectionWidth"]').value) || 0;
      totalSqFt += (height * width) / 144;
    });
    globalTotalSqFt = totalSqFt;
    
    // Compute Total Doors from Piece Count inputs.
    const doors0 = parseInt(document.querySelector('input[name="doors_0_36"]').value) || 0;
    const doors36 = parseInt(document.querySelector('input[name="doors_36_60"]').value) || 0;
    const doors60 = parseInt(document.querySelector('input[name="doors_60_82"]').value) || 0;
    globalTotalDoors = doors0 + doors36 + doors60;
    
    // Total Drawers.
    globalTotalDrawers = parseInt(document.querySelector('input[name="numDrawers"]').value) || 0;
    
    // Get Price Setup values.
    const pricePerDoor = parseFloat(document.querySelector('input[name="pricePerDoor"]').value) || 0;
    const pricePerDrawer = parseFloat(document.querySelector('input[name="pricePerDrawer"]').value) || 0;
    const pricePerLazySusan = parseFloat(document.querySelector('input[name="pricePerLazySusan"]').value) || 0;
    
    // Compute installation details.
    globalDoorInstallCost = globalTotalDoors * pricePerDoor;
    globalDrawerInstallCost = globalTotalDrawers * pricePerDrawer;
    const lazySusanQty = parseInt(document.querySelector('input[name="lazySusanQty"]').value) || 0;
    globalLazySusanInstallCost = lazySusanQty * pricePerLazySusan;
  };
  
  // Attach event listeners to update totals on input change.
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateTotals);
  });
  updateTotals();
  
  // Clear All button functionality.
  clearAllBtn.addEventListener('click', () => {
    // Save Price Setup values.
    const priceSetupInputs = document.querySelectorAll('#priceSetupContent input');
    let priceSetupValues = {};
    priceSetupInputs.forEach(input => {
      priceSetupValues[input.name] = input.value;
    });
    
    // Reset form excluding Price Setup fields.
    calcForm.reset();
    
    // Reinitialize dynamic sections.
    initializeSections();
    
    // Set default values for Piece Count and Special Features.
    document.querySelector('input[name="numDrawers"]').value = "0";
    document.querySelector('input[name="doors_0_36"]').value = "0";
    document.querySelector('input[name="doors_36_60"]').value = "0";
    document.querySelector('input[name="doors_60_82"]').value = "0";
    document.querySelector('input[name="customPaintQty"]').value = "0";
    
    // Restore Price Setup values.
    priceSetupInputs.forEach(input => {
      if (priceSetupValues[input.name] !== undefined) {
        input.value = priceSetupValues[input.name];
      }
    });
    
    updateTotals();
  });
  
  // On form submit, build the payload and send it.
  calcForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sections = [];
    const sectionDivs = document.querySelectorAll('#sectionsContainer .section');
    sectionDivs.forEach(sec => {
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
        doorDisposalCost: parseFloat(formData.get('doorDisposalCost')) || 0
      },
      disposal: {
        doorDisposalQty: parseInt(formData.get('doorDisposalQty')) || 0,
        lazySusanDisposalQty: parseInt(formData.get('lazySusanDisposalQty')) || 0
      }
    };
    
    try {
      const response = await fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resultData = await response.json();
      displayResults(resultData);
    } catch (err) {
      document.getElementById('results').textContent = 'Error: ' + err.message;
    }
  });
  
  // Updated displayResults function with an invoice-style layout and a toggle button for Installation Details.
  function displayResults(resultData) {
    if (resultData.error) {
      document.getElementById('results').innerHTML = `<h2>Error:</h2><p>${resultData.error}</p>`;
      return;
    }
    
    // Format today's date.
    const today = new Date();
    const dateStr = today.toLocaleDateString();
    
    // Extract calculated values.
    let overall = (typeof resultData.overallTotal === 'number' && !isNaN(resultData.overallTotal))
      ? resultData.overallTotal.toFixed(2)
      : "0.00";
    let allSectionsCost = (typeof resultData.doorCostTotal === 'number' && !isNaN(resultData.doorCostTotal))
      ? resultData.doorCostTotal.toFixed(2)
      : "0.00";
    let costToInstaller = (typeof resultData.costToInstaller === 'number' && !isNaN(resultData.costToInstaller))
      ? resultData.costToInstaller.toFixed(2)
      : "0.00";
    let profitMargin = (typeof resultData.profitMargin === 'number' && !isNaN(resultData.profitMargin))
      ? resultData.profitMargin.toFixed(2)
      : "0.00";
    
    // Build invoice-style layout.
    let html = `
      <div class="invoice" style="max-width:800px; margin:auto; border:1px solid #3CDBC0; padding:1em;">
        <h1 style="text-align:center; font-size:2em; margin-bottom:0;">Official Estimate</h1>
        <p style="text-align:center; font-size:0.9em;">Date: ${dateStr}</p>
        <hr style="border-color:#3CDBC0;">
        
        <h2 style="font-size:1.4em; margin-bottom:0.5em;">Summary of Charges</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="padding:0.5em; border-bottom:1px solid #3CDBC0;">ALL Section Cost</td>
            <td style="padding:0.5em; text-align:right; border-bottom:1px solid #3CDBC0;">$${allSectionsCost}</td>
          </tr>
          <tr>
            <td style="padding:0.5em; border-bottom:1px solid #3CDBC0;">Hinge Drilling Cost</td>
            <td style="padding:0.5em; text-align:right; border-bottom:1px solid #3CDBC0;">$${(resultData.hingeCost || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:0.5em; border-bottom:1px solid #3CDBC0;">Refinishing Cost</td>
            <td style="padding:0.5em; text-align:right; border-bottom:1px solid #3CDBC0;">$${(resultData.refinishingCost || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:0.5em; border-bottom:1px solid #3CDBC0;">Measuring Cost</td>
            <td style="padding:0.5em; text-align:right; border-bottom:1px solid #3CDBC0;">$${(resultData.measuringCost || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:0.5em; border-bottom:1px solid #3CDBC0;">Disposal Cost</td>
            <td style="padding:0.5em; text-align:right; border-bottom:1px solid #3CDBC0;">$${(resultData.disposalCost || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:0.5em; font-weight:bold;">Overall Total</td>
            <td style="padding:0.5em; text-align:right; font-weight:bold;">$${overall}</td>
          </tr>
        </table>
        
        <hr style="border-color:#3CDBC0;">
        
        <div id="installationDetails">
          <h2 style="font-size:1.4em; margin-bottom:0.5em;">Installation Details</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:0.5em; border-bottom:1px solid #3CDBC0;">Total Doors</td>
              <td style="padding:0.5em; text-align:right; border-bottom:1px solid #3CDBC0;">${globalTotalDoors}</td>
            </tr>
            <tr>
              <td style="padding:0.5em; border-bottom:1px solid #3CDBC0;">Total Drawers</td>
              <td style="padding:0.5em; text-align:right; border-bottom:1px solid #3CDBC0;">${globalTotalDrawers}</td>
            </tr>
            <tr>
              <td style="padding:0.5em; border-bottom:1px solid #3CDBC0;">Hinge Count</td>
              <td style="padding:0.5em; text-align:right; border-bottom:1px solid #3CDBC0;">${resultData.hingeCount}</td>
            </tr>
            <tr>
              <td style="padding:0.5em; border-bottom:1px solid #3CDBC0;">Cost To Installer</td>
              <td style="padding:0.5em; text-align:right; border-bottom:1px solid #3CDBC0;">$${costToInstaller}</td>
            </tr>
            <tr>
              <td style="padding:0.5em; font-weight:bold;">Profit Margin</td>
              <td style="padding:0.5em; text-align:right; font-weight:bold;">$${profitMargin}</td>
            </tr>
          </table>
        </div>
        <br>
        <button id="toggleInstallationBtn" style="margin-top:1em; padding:0.5em 1em;">Hide Installation Details</button>
      </div>
    `;
    
    document.getElementById('results').innerHTML = html;
    
    // Toggle Installation Details functionality.
    document.getElementById('toggleInstallationBtn').addEventListener('click', () => {
      const installDiv = document.getElementById('installationDetails');
      const toggleBtn = document.getElementById('toggleInstallationBtn');
      if (installDiv.style.display === 'none') {
        installDiv.style.display = 'block';
        toggleBtn.textContent = 'Hide Installation Details';
      } else {
        installDiv.style.display = 'none';
        toggleBtn.textContent = 'Show Installation Details';
      }
    });
    
    // Attach print functionality.
    document.getElementById('printEstimate').addEventListener('click', () => {
      window.print();
    });
  }
});
