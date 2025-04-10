// script.js

// Full list of door styles from JSON
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

const finishes = ["Painted", "Primed", "Unfinished"];

/**
 * Retrieves the data from a section div.
 * @param {HTMLElement} sectionDiv - The div representing a section.
 * @returns {Object} Section data.
 */
function getSectionData(sectionDiv) {
  return {
    doorStyle: sectionDiv.querySelector('select[name="doorStyle"]').value,
    finish: sectionDiv.querySelector('select[name="finish"]').value,
    height: parseFloat(sectionDiv.querySelector('input[name="height"]').value),
    width: parseFloat(sectionDiv.querySelector('input[name="width"]').value),
    doorSizeCategory: sectionDiv.querySelector('select[name="doorSizeCategory"]').value,
    doorCount: parseInt(sectionDiv.querySelector('input[name="doorCount"]').value),
    lazySusanQty: parseInt(sectionDiv.querySelector('input[name="lazySusanQty"]').value),
    customPaintQty: parseInt(sectionDiv.querySelector('input[name="customPaintQty"]').value)
  };
}

function createSection(index) {
  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'section';
  sectionDiv.dataset.index = index;
  sectionDiv.innerHTML = `
    <h3>Section ${index + 1}</h3>
    <label>
      Door Style:
      <select name="doorStyle">
        ${doorStyles.map(style => `<option value="${style}">${style}</option>`).join('')}
      </select>
    </label>
    <br/>
    <label>
      Finish:
      <select name="finish">
        ${finishes.map(finish => `<option value="${finish}">${finish}</option>`).join('')}
      </select>
    </label>
    <br/>
    <label>
      Height (inches):
      <input type="number" name="height" value="12" step="0.1" required />
    </label>
    <br/>
    <label>
      Width (inches):
      <input type="number" name="width" value="12" step="0.1" required />
    </label>
    <br/>
    <label>
      Door Size Category:
      <select name="doorSizeCategory">
        <option value="0-36">0"-36"</option>
        <option value="36.01-60">36.01"-60"</option>
        <option value="60.01-82">60.01"-82"</option>
      </select>
    </label>
    <br/>
    <label>
      Number of Doors:
      <input type="number" name="doorCount" value="0" min="0" />
    </label>
    <br/>
    <label>
      Lazy Susan Quantity:
      <input type="number" name="lazySusanQty" value="0" min="0" />
    </label>
    <br/>
    <label>
      Custom Paint Quantity:
      <input type="number" name="customPaintQty" value="0" min="0" />
    </label>
  `;
  
  if (index > 0) {
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'removeSectionBtn';
    removeBtn.textContent = 'X';
    removeBtn.addEventListener('click', () => {
      sectionDiv.remove();
      updateSectionIndices();
    });
    sectionDiv.appendChild(removeBtn);
  }
  
  if (index === 0) {
    sectionDiv.querySelector('select[name="doorStyle"]').addEventListener('change', propagateFirstSectionChange);
    sectionDiv.querySelector('select[name="finish"]').addEventListener('change', propagateFirstSectionChange);
  }
  
  return sectionDiv;
}

function updateSectionIndices() {
  const sections = document.querySelectorAll('.section');
  sections.forEach((section, index) => {
    section.dataset.index = index;
    section.querySelector('h3').textContent = `Section ${index + 1}`;
  });
}

function propagateFirstSectionChange() {
  const firstSection = document.querySelector('.section[data-index="0"]');
  const newDoorStyle = firstSection.querySelector('select[name="doorStyle"]').value;
  const newFinish = firstSection.querySelector('select[name="finish"]').value;

  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    if (section.dataset.index !== "0") {
      section.querySelector('select[name="doorStyle"]').value = newDoorStyle;
      section.querySelector('select[name="finish"]').value = newFinish;
    }
  });
}

/**
 * Builds a formatted UI for results and inserts it into the results container.
 * @param {Object} data - The JSON data returned from the /calculate endpoint.
 */
function displayResults(data) {
  const resultsContainer = document.getElementById('results');
  let html = `<h2>Overall Total: $${data.overallTotal.toFixed(2)}</h2>`;
  
  data.sections.forEach((section, index) => {
    html += `<div class="result-section">
      <h3>Section ${index + 1}</h3>
      <div class="result-row"><span>Door Cost:</span><span>$${section.doorCost.toFixed(2)}</span></div>
      <div class="result-row"><span>Hinge Cost:</span><span>$${section.hingeCost.toFixed(2)}</span></div>
      <div class="result-row"><span>Lazy Susan Cost:</span><span>$${section.lazySusanCost.toFixed(2)}</span></div>
      <div class="result-row"><span>Custom Paint Cost:</span><span>$${section.customPaintCost.toFixed(2)}</span></div>
      <div class="result-row"><strong>Total Section Cost:</strong><strong>$${section.totalSectionCost.toFixed(2)}</strong></div>
    </div>`;
  });
  
  resultsContainer.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  const sectionsContainer = document.getElementById('sectionsContainer');
  const addSectionBtn = document.getElementById('addSectionBtn');
  const calcForm = document.getElementById('calcForm');

  // Start with 2 sections by default.
  for (let i = 0; i < 2; i++) {
    sectionsContainer.appendChild(createSection(i));
  }

  addSectionBtn.addEventListener('click', () => {
    const index = sectionsContainer.children.length;
    sectionsContainer.appendChild(createSection(index));
  });

  calcForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sections = [];
    Array.from(sectionsContainer.children).forEach(sectionDiv => {
      sections.push(getSectionData(sectionDiv));
    });

    try {
      const response = await fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      });
      const data = await response.json();
      displayResults(data);
    } catch (err) {
      document.getElementById('results').textContent = 'Error: ' + err.message;
    }
  });
});
