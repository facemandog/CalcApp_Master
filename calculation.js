// calculation.js

/** Calculate Area (sq ft) from inches. */
function calculateArea(height, width) {
  return (Number(height || 0) * Number(width || 0)) / 144;
}

/** Get price per sq ft for door/drawer style/finish. */
function getPriceForDoor(pricingData, style, finish) {
  if (!pricingData || !pricingData.doorPricing) return 0;
  if (
    pricingData.doorPricing[style] &&
    pricingData.doorPricing[style][finish]
  ) {
    return Number(pricingData.doorPricing[style][finish]) || 0;
  }
  return 0;
}

/** Calculate cost for one Rough Estimate section. */
function calculateSectionCost(section, pricingData) {
  const area = calculateArea(section.height, section.width);
  const doorPrice = getPriceForDoor(pricingData, section.doorStyle, section.finish);
  const drawerPrice = getPriceForDoor(pricingData, section.drawerStyle, section.finish);
  const doorCost = Number(area * doorPrice) || 0;
  const drawerCost = (section.doorStyle === section.drawerStyle || drawerPrice === 0) ? 0 : (Number(area * drawerPrice) || 0);

  return {
      area: Number(area.toFixed(4)),
      doorCost: Number(doorCost.toFixed(2)),
      drawerCost: Number(drawerCost.toFixed(2)),
      totalSectionCost: Number((doorCost + drawerCost).toFixed(2)),
      doorStyle: section.doorStyle,
      drawerStyle: section.drawerStyle,
      finish: section.finish,
      height: section.height,
      width: section.width
    };
}

/** Calculate hinge drilling cost. */
function calculateHingeCost(part2, hingeCosts) {
    if (!part2 || !hingeCosts) return 0;
    const d0_36 = Number(part2.doors_0_36 || 0);
    const d36_60 = Number(part2.doors_36_60 || 0);
    const d60_82 = Number(part2.doors_60_82 || 0);
    const c0_36 = Number(hingeCosts["0-36"] || 0);
    const c36_60 = Number(hingeCosts["36.01-60"] || 0);
    const c60_82 = Number(hingeCosts["60.01-82"] || 0);
    return (d0_36 * c0_36) + (d36_60 * c36_60) + (d60_82 * c60_82);
}

/** Calculate special features cost (custom paint). */
function calculateSpecialFeaturesCost(part3, pricingData) {
    if (!part3 || !pricingData || !pricingData.customPaint) return { customPaintCost: 0 };
    const qty = Number(part3.customPaintQty || 0);
    const price = Number(pricingData.customPaint.price || 0);
    return { customPaintCost: qty * price };
}

/** Calculate refinishing cost. */
function calculateRefinishingCost(totalSqFt, refinishingCostPerSqFt) {
  const sqFt = Number(totalSqFt) || 0;
  const costPerSqFt = Number(refinishingCostPerSqFt) || 0;
  return sqFt * costPerSqFt;
}

/** Calculate installation cost. */
function calculateInstallationCost(priceSetup, part2) {
    if (!priceSetup || !part2) return { doorInstall: 0, drawerInstall: 0, lazySusanInstall: 0, totalInstall: 0 };
    const totalDoors = Number(part2.totalDoors || 0); // Actual doors from input
    const totalDrawers = parseInt(part2.numDrawers) || 0;
    const lazySusanQty = parseInt(part2.lazySusanQty) || 0;
    const pricePerDoor = Number(priceSetup.pricePerDoor) || 0;
    const pricePerDrawer = Number(priceSetup.pricePerDrawer) || 0;
    const pricePerLazySusan = Number(priceSetup.pricePerLazySusan) || 0;
    const doorInstall = totalDoors * pricePerDoor;
    const drawerInstall = totalDrawers * pricePerDrawer;
    const lazySusanInstall = lazySusanQty * pricePerLazySusan;
    return {
      doorInstall,
      drawerInstall,
      lazySusanInstall,
      totalInstall: doorInstall + drawerInstall + lazySusanInstall
    };
}

/**
 * Main calculation function.
 * Adds Lazy Susan Surcharge to overall total.
 * @param {Object} payload - Client payload.
 * @param {Object} pricingData - Pricing JSON.
 * @returns {Object} Breakdown of results.
 */
function calculateOverallTotal(payload, pricingData) {
  // Basic validation
  if (!payload || !payload.sections || !payload.part2 || !payload.part3 || !payload.priceSetup) {
      throw new Error("Invalid payload structure received.");
  }
  if (!pricingData || !pricingData.hingeCosts || !pricingData.customPaint || !pricingData.doorPricing) {
       throw new Error("Invalid pricingData structure.");
  }

  // Calculate section costs
  let totalAllSectionCost = 0;
  const sectionBreakdown = [];
  payload.sections.forEach(section => {
    if(section && typeof section === 'object'){
        const result = calculateSectionCost(section, pricingData);
        sectionBreakdown.push(result);
        totalAllSectionCost += result.totalSectionCost || 0;
    } else { console.warn("Skipping invalid section in payload:", section); }
  });

  // Hinge cost
  const hingeCost = calculateHingeCost(payload.part2, pricingData.hingeCosts);

  // Special features cost
  const specialFeatures = calculateSpecialFeaturesCost(payload.part3, pricingData);

  // Total Square Footage
  const totalSqFt = Number(payload.priceSetup.onSiteMeasuringSqFt || 0);

  // Refinishing cost
  const refinishingCost = calculateRefinishingCost(totalSqFt, payload.priceSetup.refinishingCostPerSqFt);

  // Measuring cost
  const measuringCost = Number(payload.priceSetup.onSiteMeasuring || 0);

  // Installation cost (based on actual inputs)
  const installation = calculateInstallationCost(payload.priceSetup, payload.part2);

  // Conditional Disposal Cost Calculation
  let disposalCost = 0;
  let doorsForDisposal = 0;
  let drawersForDisposal = 0; // Track drawers separately
  let lazySusansForDisposal = 0;

  // Check the flag from part3 now
  if (payload.part3.calculateDisposal === 'yes') {
    doorsForDisposal = Number(payload.part2.totalDoors || 0); // Actual doors
    drawersForDisposal = Number(payload.part2.numDrawers || 0); // Number of drawers
    lazySusansForDisposal = Number(payload.part2.lazySusanQty || 0);

    const doorDisposalRate = Number(payload.priceSetup.doorDisposalCost || 0);

    // Calculate total units: Doors + Drawers + (Lazy Susans * 2)
    const totalDisposalUnits = doorsForDisposal + drawersForDisposal + (lazySusansForDisposal * 2);

    disposalCost = totalDisposalUnits * doorDisposalRate;
  }

  // Calculate Lazy Susan Surcharge
  const lazySusanQty = Number(payload.part2.lazySusanQty || 0);
  const lazySusanSurchargePerUnit = 50;
  const lazySusanSurchargeTotal = lazySusanQty * lazySusanSurchargePerUnit;

  // Cost to Installer
  const costToInstaller = Number(totalAllSectionCost) + Number(hingeCost);

  // --- CORRECTED Overall Total Sum ---
  const overallTotal =
    Number(totalAllSectionCost || 0) +
    Number(hingeCost || 0) +
    Number(specialFeatures.customPaintCost || 0) +
    Number(refinishingCost || 0) +
    Number(measuringCost || 0) +
    Number(installation.totalInstall || 0) +
    Number(disposalCost || 0) +
    Number(lazySusanSurchargeTotal || 0); // Added surcharge correctly
  // --- END CORRECTION ---

  // Profit Margin
  const profitMargin = Number(overallTotal) - Number(costToInstaller);

  // Hinge Count
  const hingeCount =
    (Number(payload.part2.doors_0_36 || 0) * 2) +
    (Number(payload.part2.doors_36_60 || 0) * 3) +
    (Number(payload.part2.doors_60_82 || 0) * 4);

  // Format final results safely
  const format = (num) => Number((Number(num) || 0).toFixed(2));

  return {
    overallTotal: format(overallTotal),
    doorCostTotal: format(totalAllSectionCost),
    costToInstaller: format(costToInstaller),
    profitMargin: format(profitMargin),
    hingeCost: format(hingeCost),
    hingeCount,
    specialFeatures: { customPaintCost: format(specialFeatures.customPaintCost) },
    refinishingCost: format(refinishingCost),
    measuringCost: format(measuringCost),
    installation: { // Installation costs based on actual counts
        doorInstall: format(installation.doorInstall),
        drawerInstall: format(installation.drawerInstall),
        lazySusanInstall: format(installation.lazySusanInstall),
        totalInstall: format(installation.totalInstall)
    },
    // lazySusanSurcharge: format(lazySusanSurchargeTotal), // Optional: return surcharge separately
    disposalCost: format(disposalCost),
    doorsForDisposal,
    drawersForDisposal, // <<< ADDED Drawers for disposal to return object
    lazySusansForDisposal,
    sections: sectionBreakdown,
    part2: payload.part2, // Contains original lazySusanQty needed by frontend
    part3: payload.part3, // <<< Pass back part3 (contains flag)
    priceSetup: payload.priceSetup
  };
}

module.exports = {
  calculateOverallTotal
};