// calculation.js

/**
 * Calculate the area (in square feet) from height and width (in inches).
 * @param {number} height - Height in inches.
 * @param {number} width - Width in inches.
 * @returns {number} Area in square feet.
 */
function calculateArea(height, width) {
  return (height * width) / 144;
}

/**
 * Retrieves the price per square foot for a door/drawer given its style and finish.
 * @param {Object} pricingData - The pricing JSON (contains doorPricing).
 * @param {string} style - E.g., "Shaker" or a drawer style.
 * @param {string} finish - E.g., "Painted".
 * @returns {number} The price per square foot.
 */
function getPriceForDoor(pricingData, style, finish) {
  if (
    pricingData.doorPricing &&
    pricingData.doorPricing[style] &&
    pricingData.doorPricing[style][finish]
  ) {
    return pricingData.doorPricing[style][finish];
  }
  return 0;
}

/**
 * Computes the costs for a Rough Estimate section.
 * It calculates the area, then computes both the door cost (using doorStyle) and the drawer cost (using drawerStyle).
 * If the drawer style equals the door style, the drawer cost is set to 0.
 * @param {Object} section - An object with properties: doorStyle, drawerStyle, finish, height, and width.
 * @param {Object} pricingData - Contains doorPricing.
 * @returns {Object} Returns the area, doorCost, drawerCost, and totalSectionCost.
 */
function calculateSectionCost(section, pricingData) {
  const area = calculateArea(section.height, section.width);
  const doorPrice = getPriceForDoor(pricingData, section.doorStyle, section.finish);
  const drawerPrice = getPriceForDoor(pricingData, section.drawerStyle, section.finish);
  const doorCost = area * doorPrice;
  const drawerCost = (section.doorStyle === section.drawerStyle) ? 0 : (area * drawerPrice);
  return { area, doorCost, drawerCost, totalSectionCost: doorCost + drawerCost };
}

/**
 * Computes the hinge drilling cost using Part 2 information.
 * @param {Object} part2 - Contains doors_0_36, doors_36_60, doors_60_82.
 * @param {Object} hingeCosts - From pricingData.hingeCosts.
 * @returns {number} Total hinge cost.
 */
function calculateHingeCost(part2, hingeCosts) {
  return (
    (part2.doors_0_36 * (hingeCosts["0-36"] || 0)) +
    (part2.doors_36_60 * (hingeCosts["36.01-60"] || 0)) +
    (part2.doors_60_82 * (hingeCosts["60.01-82"] || 0))
  );
}

/**
 * Computes the total cost for special features.
 * Since Lazy Susan Quantity has been removed, we only consider custom paint choices.
 * @param {Object} part3 - Contains customPaintQty.
 * @param {Object} pricingData - Contains customPaint pricing.
 * @returns {Object} Contains customPaintCost.
 */
function calculateSpecialFeaturesCost(part3, pricingData) {
  const customPaintCost = part3.customPaintQty * (pricingData.customPaint.price || 0);
  return { customPaintCost };
}

/**
 * Calculates the refinishing cost.
 * @param {number} totalSqFt - Total square footage.
 * @param {number} refinishingCostPerSqFt - The refinishing cost per sq ft from Price Setup.
 * @returns {number} The calculated refinishing cost.
 */
function calculateRefinishingCost(totalSqFt, refinishingCostPerSqFt) {
  return totalSqFt * refinishingCostPerSqFt;
}

/**
 * Computes the installation costs using values from Price Setup.
 * @param {Object} priceSetup - Contains pricePerDoor, pricePerDrawer.
 * @param {Object} part2 - Contains totalDoors and numDrawers.
 * @param {Object} part3 - (Now, lazySusan fields are removed)
 * @returns {Object} Contains doorInstall, drawerInstall, and totalInstall.
 */
function calculateInstallationCost(priceSetup, part2) {
  const totalDoors = part2.totalDoors;
  const totalDrawers = parseInt(part2.numDrawers) || 0;
  const doorInstall = totalDoors * priceSetup.pricePerDoor;
  const drawerInstall = totalDrawers * priceSetup.pricePerDrawer;
  // Lazy Susan installation is no longer computed.
  return {
    doorInstall,
    drawerInstall,
    totalInstall: doorInstall + drawerInstall
  };
}

/**
 * Main calculation function that computes the overall total along with new fields:
 * - Total ALL Section Cost: Sum of all Rough Estimate section total costs.
 * - Installer Cost: (Total ALL Section Cost) x 0.75.
 * - Profit Margin: (Total ALL Section Cost) minus (Installer Cost).
 * - Hinge Count: Calculated as:
 *      (Doors 0"-36" * 2) + (Doors 36.01"-60" * 3) + (Doors 60.01"-82" * 4)
 * Uses the new payload structure with a "priceSetup" object.
 * @param {Object} payload - The JSON payload sent from the client.
 * @param {Object} pricingData - Contains doorPricing, hingeCosts, customPaint pricing.
 * @returns {Object} A breakdown of the final result.
 */
function calculateOverallTotal(payload, pricingData) {
  // Calculate section costs for each Rough Estimate section.
  let totalAllSectionCost = 0;
  const sectionBreakdown = [];
  payload.sections.forEach(section => {
    const result = calculateSectionCost(section, pricingData);
    sectionBreakdown.push({
      area: result.area,
      doorCost: result.doorCost,
      drawerCost: result.drawerCost,
      totalSectionCost: result.totalSectionCost
    });
    totalAllSectionCost += result.totalSectionCost;
  });
  
  // Compute hinge drilling cost.
  const hingeCost = calculateHingeCost(payload.part2, pricingData.hingeCosts);
  
  // Compute special features cost (custom paint only).
  const specialFeatures = calculateSpecialFeaturesCost(payload.part3, pricingData);
  
  // Get total square footage from payload.priceSetup.onSiteMeasuring? Actually, we are moving On Site Measuring to Price Setup.
  const totalSqFt = payload.priceSetup.onSiteMeasuringSqFt || payload.part5.totalSqFt || 0; // If onSiteMeasuring is used as measuring input, use from priceSetup.
  
  // Compute refinishing cost from Price Setup.
  const refinishingCost = calculateRefinishingCost(totalSqFt, payload.priceSetup.refinishingCostPerSqFt);
  
  // On site measuring cost now comes from Price Setup.
  const measuringCost = payload.priceSetup.onSiteMeasuring || 0;
  
  // Compute installation cost using Price Setup values.
  const installation = calculateInstallationCost(payload.priceSetup, payload.part2);
  
  // New fields:
  // Installer Cost = Total ALL Section Cost x 0.75.
  const installerCost = totalAllSectionCost * 0.75;
  // Profit Margin = Total ALL Section Cost - Installer Cost.
  const profitMargin = totalAllSectionCost - installerCost;
  
  // Compute Hinge Count = (doors_0_36 * 2) + (doors_36_60 * 3) + (doors_60_82 * 4).
  const hingeCount = 
    (payload.part2.doors_0_36 * 2) +
    (payload.part2.doors_36_60 * 3) +
    (payload.part2.doors_60_82 * 4);
  
  // Overall total includes all components.
  const overallTotal =
    totalAllSectionCost +
    hingeCost +
    specialFeatures.customPaintCost +
    refinishingCost +
    measuringCost +
    installation.totalInstall;
  
  return {
    overallTotal,
    doorCostTotal: totalAllSectionCost, // Total ALL Section Cost.
    installerCost,
    profitMargin,
    hingeCost,
    hingeCount,
    specialFeatures,
    refinishingCost,
    measuringCost,
    installation,
    sections: sectionBreakdown
  };
}

module.exports = {
  calculateOverallTotal
};
