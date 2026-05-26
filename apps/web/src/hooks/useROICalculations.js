import { useMemo } from "react";

export function useROICalculations({
  volume,
  baselineRate,
  costPerCulture,
  losExtension,
  period,
  // Global rate input mode
  globalRateMode,           // "blended" | "device"
  // Scenario 1 — Baseline alt product
  baselineHasAltProduct,
  baselineAltRate,              // device-specific rate (device mode)
  baselineAltBlendedRate,       // observed blended rate (blended mode)
  baselineAltNonSteripathRate,  // non-device rate (device mode)
  baselineAltUtilization,
  baselineAltDeviceCost,
  // Steripath device params (shared Sc. 2 & 3)
  steripathDeviceCost,
  // Scenario 2 — Steripath Implemented
  steripathUtilization,
  currentSteripathRate,
  currentBlendedRate,
  currentNonSteripathRate,
  // Scenario 3 — Target
  bestSteripathRate,
  bestSteripathUtilization,
  bestBlendedRate,
  bestNonSteripathRate,
}) {
  return useMemo(() => {
    const v = Number(volume) || 0;
    const blRate = Number(baselineRate) || 0;
    const cpc = Number(costPerCulture) || 0;
    const los = Number(losExtension) || 0;
    const per = Number(period) || 12;
    const rateMode = globalRateMode || "blended";

    const spDev = Number(steripathDeviceCost) || 0;
    const spDpc = 1; // Devices per culture assumed to be 1
    const spUtil = Number(steripathUtilization) || 0;
    const spBestUtil = Number(bestSteripathUtilization) ?? spUtil;
    const spCur = Number(currentSteripathRate) || 0;
    const spBest = Number(bestSteripathRate) || 0;
    const curBlended = Number(currentBlendedRate) || 0;
    const bestBlended = Number(bestBlendedRate) || 0;
    // Non-Steripath (unprotected draw) rates — fall back to baseline if not provided
    const curNonSP = Number(currentNonSteripathRate) || blRate;
    const bestNonSP = Number(bestNonSteripathRate) || blRate;

    // ─── Scenario 1: Baseline ───────────────────────────────────────────────
    let blContam, blDeviceCost;
    if (baselineHasAltProduct) {
      const altDec = (Number(baselineAltUtilization) || 0) / 100;
      blDeviceCost =
        v *
        altDec *
        1 * // Devices per culture assumed to be 1
        (Number(baselineAltDeviceCost) || 0);

      if (rateMode === "blended") {
        // Blended mode: use the observed blended rate directly
        blContam = v * ((Number(baselineAltBlendedRate) || 0) / 100);
      } else {
        // Device mode: weighted mix of device and non-device draws
        const altRate = (Number(baselineAltRate) || 0) / 100;
        const altNonSP = (Number(baselineAltNonSteripathRate) || blRate) / 100;
        blContam = v * (altDec * altRate + (1 - altDec) * altNonSP);
      }
    } else {
      blContam = v * (blRate / 100);
      blDeviceCost = 0;
    }
    const blContamCost = blContam * cpc;
    const blTotalCost = blContamCost + blDeviceCost;
    const blBedDays = blContam * los;

    const baseline = {
      contaminations: blContam,
      contaminationCost: blContamCost,
      bedDays: blBedDays,
      deviceCost: blDeviceCost,
      totalCost: blTotalCost,
      netSavings: 0,
      bedDaysFreed: 0,
      contaminationsAvoided: 0,
      roi: 0,
      paybackMonths: null,
      blendedRate: v > 0 ? (blContam / v) * 100 : blRate,
    };

    // ─── Scenarios 2–3 builder ──────────────────────────────────────────────
    // rateMode: "device"  → compute blended from deviceRate + util + nonSteripathRate
    //           "blended" → use directBlendedRate for contaminations; util drives device cost only
    const buildScenario = (
      deviceRate,
      util,
      costPerDevice,
      dpc,
      directBlendedRate = 0,
      nonSteripathRate = blRate,
    ) => {
      const dec = util / 100;

      let contaminations;
      if (rateMode === "device") {
        contaminations =
          v * dec * (deviceRate / 100) + v * (1 - dec) * (nonSteripathRate / 100);
      } else {
        contaminations = v * (directBlendedRate / 100);
      }

      const contaminationCost = contaminations * cpc;
      const bedDays = contaminations * los;
      const deviceCost = v * dec * dpc * costPerDevice;
      const totalCost = contaminationCost + deviceCost;

      const grossCostReduction = blContamCost - contaminationCost;
      const netSavings = blTotalCost - totalCost;
      const roi = deviceCost > 0 ? (netSavings / deviceCost) * 100 : 0;
      const paybackMonths =
        deviceCost > 0 && grossCostReduction > 0
          ? (deviceCost / grossCostReduction) * per
          : null;
      const blendedRate = v > 0 ? (contaminations / v) * 100 : 0;

      return {
        contaminations,
        contaminationCost,
        bedDays,
        deviceCost,
        totalCost,
        netSavings,
        bedDaysFreed: blBedDays - bedDays,
        contaminationsAvoided: blContam - contaminations,
        roi,
        paybackMonths,
        blendedRate,
      };
    };

    const current = buildScenario(spCur, spUtil, spDev, spDpc, curBlended, curNonSP);
    const best = buildScenario(spBest, spBestUtil, spDev, spDpc, bestBlended, bestNonSP);

    return { baseline, current, best };
  }, [
    volume, baselineRate, costPerCulture, losExtension, period,
    globalRateMode,
    baselineHasAltProduct, baselineAltRate, baselineAltBlendedRate, baselineAltNonSteripathRate,
    baselineAltUtilization, baselineAltDeviceCost,
    steripathDeviceCost,
    steripathUtilization, currentSteripathRate, currentBlendedRate, currentNonSteripathRate,
    bestSteripathRate, bestSteripathUtilization, bestBlendedRate, bestNonSteripathRate,
  ]);
}
