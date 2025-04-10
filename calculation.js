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
 * It calculates the area, then computes both the door cost (using doorStyle)
 * and the drawer cost (using drawerStyle). If the drawer style equals the door style,
 * the drawer cost is set to 0.
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
 * Since Lazy Susan Quantity has now been moved to installation calculations,
 * we only consider custom paint choices here.
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
 * Calculates the disposal cost.
 * @param {Object} disposal - Contains doorDisposalQty and lazySusanDisposalQty.
 * @param {number} doorDisposalCost - The cost per door for disposal (from Price Setup).
 * @returns {number} The calculated total disposal cost.
 */
function calculateDisposalCost(disposal, doorDisposalCost) {
  const doorDisposalQty = disposal && disposal.doorDisposalQty ? parseInt(disposal.doorDisposalQty) || 0 : 0;
  const lazySusanDisposalQty = disposal && disposal.lazySusanDisposalQty ? parseInt(disposal.lazySusanDisposalQty) || 0 : 0;
  return (doorDisposalQty + (lazySusanDisposalQty * 2)) * doorDisposalCost;
}

/**
 * Computes the installation costs using values from Price Setup.
 * Now includes installation cost for lazySusans.
 * @param {Object} priceSetup - Contains pricePerDoor, pricePerDrawer, pricePerLazySusan.
 * @param {Object} part2 - Contains totalDoors, numDrawers, and lazySusanQty.
 * @returns {Object} Contains doorInstall, drawerInstall, lazySusanInstall, and totalInstall.
 */
function calculateInstallationCost(priceSetup, part2) {
  const totalDoors = part2.totalDoors;
  const totalDrawers = parseInt(part2.numDrawers) || 0;
  const lazySusanQty = parseInt(part2.lazySusanQty) || 0;
  const doorInstall = totalDoors * priceSetup.pricePerDoor;
  const drawerInstall = totalDrawers * priceSetup.pricePerDrawer;
  const lazySusanInstall = lazySusanQty * priceSetup.pricePerLazySusan;
  return {
    doorInstall,
    drawerInstall,
    lazySusanInstall,
    totalInstall: doorInstall + drawerInstall + lazySusanInstall
  };
}

/**
 * Main calculation function that computes the overall total along with new fields:
 * - Total ALL Section Cost: Sum of all Rough Estimate section total costs.
 * - Cost To Installer: (Total ALL Section Cost) + (Hinge Drilling Cost).
 * - Profit Margin: Overall Total - Cost To Installer.
 * - Hinge Count: Calculated as:
 *      (Doors 0"-36" * 2) + (Doors 36.01"-60" * 3) + (Doors 60.01"-82" * 4)
 * - Disposal Cost: Calculated from disposal inputs.
 * Overall Total now includes the Disposal Cost.
 * Uses the new payload structure with a "priceSetup" object.
 * @param {Object} payload - The JSON payload sent from the client.
 *        Expected additional properties:
 *          payload.disposal with fields doorDisposalQty and lazySusanDisposalQty.
 * @param {Object} pricingData - Contains doorPricing, hingeCosts, and customPaint pricing.
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
  
  // Get total square footage.
  const totalSqFt = payload.priceSetup.onSiteMeasuringSqFt || payload.part5.totalSqFt || 0;
  
  // Compute refinishing cost from Price Setup.
  const refinishingCost = calculateRefinishingCost(totalSqFt, payload.priceSetup.refinishingCostPerSqFt);
  
  // On site measuring cost now comes from Price Setup.
  const measuringCost = payload.priceSetup.onSiteMeasuring || 0;
  
  // Compute installation cost using Price Setup values.
  const installation = calculateInstallationCost(payload.priceSetup, payload.part2);
  
  // Compute Disposal Cost using the new doorDisposalCost from Price Setup.
  const disposalCost = payload.disposal ? calculateDisposalCost(payload.disposal, payload.priceSetup.doorDisposalCost) : 0;
  
  // New field: Cost To Installer = Total ALL Section Cost + Hinge Drilling Cost.
  const costToInstaller = totalAllSectionCost + hingeCost;
  
  // Overall Total includes all components plus disposal cost.
  const overallTotal =
    totalAllSectionCost +
    hingeCost +
    specialFeatures.customPaintCost +
    refinishingCost +
    measuringCost +
    installation.totalInstall +
    disposalCost;
  
  // Profit Margin = Overall Total - Cost To Installer.
  const profitMargin = overallTotal - costToInstaller;
  
  // Compute Hinge Count = (doors_0_36 * 2) + (doors_36_60 * 3) + (doors_60_82 * 4).
  const hingeCount = 
    (payload.part2.doors_0_36 * 2) +
    (payload.part2.doors_36_60 * 3) +
    (payload.part2.doors_60_82 * 4);
  
  return {
    overallTotal,
    doorCostTotal: totalAllSectionCost, // Total ALL Section Cost.
    costToInstaller,
    profitMargin,
    hingeCost,
    hingeCount,
    specialFeatures,
    refinishingCost,
    measuringCost,
    installation,
    disposalCost,
    sections: sectionBreakdown
  };
}

module.exports = {
  calculateOverallTotal
};
