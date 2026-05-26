import { useState, useRef } from "react";
import { BarChart2 } from "lucide-react";
import { InputField } from "./InputField";
import { CalculatedField } from "./CalculatedField";
import { formatNumber, formatCurrencyWhole } from "@/utils/formatters";

function Toggle({ checked, onChange, color = "bg-[#9AA1AA]" }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? color : "bg-[#CBCFD3]"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block w-4 h-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// Top-level component to avoid remount/focus-loss on re-render
function AltRateRow({
  mode,
  utilVal,
  onUtilChange,
  nonSteripathVal,
  onNonSteripathChange,
  baselinePlaceholder,
  altDeviceRateVal,
  onAltDeviceRateChange,
  blendedVal,
  onBlendedChange,
  calcBlended,
  isMobile,
}) {
  const [utilError, setUtilError] = useState(false);
  const warningTimerRef = useRef(null);

  const showError = (msg) => {
    setUtilError(msg);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => setUtilError(null), 10000);
  };

  const handleUtilChange = (rawVal) => {
    const n = Number(rawVal);
    if (n > 100) {
      onUtilChange(100);
      showError("Utilization cannot exceed 100%");
    } else {
      onUtilChange(rawVal === "" ? "" : n);
    }
  };

  const handleUtilBlur = () => {
    const n = Number(utilVal);
    if (!utilVal || n <= 0) {
      onUtilChange(1);
      showError("Utilization must be at least 1%");
    }
  };

  const atMaxUtil = Number(utilVal) >= 100;
  const isBlended = mode === "blended";

  return (
    <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : isBlended ? "grid-cols-2" : "grid-cols-4"}`}>
      {/* Col 1 — Utilization */}
      <div>
        <InputField
          label="Device Utilization"
          value={utilVal}
          onChange={(e) => handleUtilChange(e.target.value)}
          onBlur={handleUtilBlur}
          type="number"
          suffix="%"
          step="1"
          min="1"
          max="100"
        />
        {utilError && (
          <p className="text-xs text-[#F05C47] font-semibold mt-1 leading-tight">
            {utilError}
          </p>
        )}
      </div>

      {/* Blended mode: only show Blended Rate input */}
      {isBlended ? (
        <InputField
          label="Blended Contamination Rate"
          value={blendedVal}
          onChange={(e) => onBlendedChange(e.target.value)}
          type="number"
          suffix="%"
          step="0.01"
          min="0"
          maxDecimals={2}
        />
      ) : (
        <>
          {/* Device mode Col 2 — Device Contamination Rate (before non-device) */}
          <InputField
            label="Device Contamination Rate"
            value={altDeviceRateVal}
            onChange={(e) => onAltDeviceRateChange(e.target.value)}
            type="number"
            suffix="%"
            step="0.01"
            min="0"
            maxDecimals={2}
          />

          {/* Device mode Col 3 — Non-Device Contamination Rate */}
          {atMaxUtil ? (
            <CalculatedField
              label="Non-Device Contamination Rate"
              value="N/A"
            />
          ) : (
            <InputField
              label="Non-Device Contamination Rate"
              value={nonSteripathVal}
              onChange={(e) => onNonSteripathChange(e.target.value)}
              type="number"
              suffix="%"
              step="0.01"
              min="0"
              maxDecimals={2}
              placeholder={baselinePlaceholder}
            />
          )}

          {/* Device mode Col 4 — Calculated Blended Rate */}
          <CalculatedField
            label="Calculated Blended Rate"
            value={calcBlended != null ? Number(calcBlended).toFixed(2) : "—"}
            suffix="%"
          />
        </>
      )}
    </div>
  );
}

export function BaselineInputs({
  baselineRate,
  setBaselineRate,
  baselineHasAltProduct,
  setBaselineHasAltProduct,
  baselineAltRate,
  setBaselineAltRate,
  baselineAltBlendedRate,
  setBaselineAltBlendedRate,
  baselineAltNonSteripathRate,
  setBaselineAltNonSteripathRate,
  baselineAltUtilization,
  setBaselineAltUtilization,
  baselineAltDeviceCost,
  setBaselineAltDeviceCost,
  globalRateMode,
  calculations,
  isMobile,
}) {
  // Compute blended rate for alt-device section (device mode display) and baseline field
  const altDec = (Number(baselineAltUtilization) || 0) / 100;
  const altRate = Number(baselineAltRate) || 0;
  const altNonSP = Number(baselineAltNonSteripathRate) || Number(baselineRate) || 0;
  const calcAltBlended = altDec * altRate + (1 - altDec) * altNonSP;

  // When alt device is on, the top-level baseline rate field is derived (read-only):
  //   blended mode → use the directly-entered blended rate from the alt device section
  //   device mode  → use the calculated blended rate from utilization × rates
  const derivedBaselineRate =
    globalRateMode === "blended"
      ? Number(baselineAltBlendedRate) || 0
      : calcAltBlended;

  return (
    <div className={`bg-gradient-to-br from-[#F2F6F7] to-[#E8ECEE] rounded-2xl border border-[#CBCFD3] shadow-sm space-y-5 ${isMobile ? "p-5" : "p-8"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#CBD5E1] pb-4">
        <BarChart2 className="text-[#636D78]" size={20} />
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white bg-[#9AA1AA]">
              1
            </span>
            <h2 className="font-bold text-lg text-[#334155]">
              Baseline Scenario
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Starting point before Steripath®
          </p>
        </div>
      </div>

      {/* Alt product toggle — sits ABOVE the baseline contamination rate */}
      <div>
        <div className={`flex items-center justify-between ${baselineHasAltProduct ? "mb-4" : ""}`}>
          <div>
            <p className="font-semibold text-sm text-[#334155]">
              Was this account using an alternative diversion device?
            </p>
            <p className="text-xs text-[#9AA1AA] mt-0.5">
              If yes, baseline reflects a blended rate — enter that device's details below
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-slate-400">
              {baselineHasAltProduct ? "Yes" : "No"}
            </span>
            <Toggle
              checked={baselineHasAltProduct}
              onChange={setBaselineHasAltProduct}
              color="bg-[#D4A800]"
            />
          </div>
        </div>

        {baselineHasAltProduct && (
          <div className="rounded-xl bg-gradient-to-br from-[#FFFBE8] to-[#FFF5CC] border border-[#FFCC66] p-4 space-y-4">
            <p className="text-xs font-bold text-[#5C4400] uppercase tracking-wide">
              Alternative Device — Baseline Parameters
            </p>

            {/* Rate row */}
            <AltRateRow
              mode={globalRateMode || "blended"}
              utilVal={baselineAltUtilization}
              onUtilChange={setBaselineAltUtilization}
              nonSteripathVal={baselineAltNonSteripathRate}
              onNonSteripathChange={setBaselineAltNonSteripathRate}
              baselinePlaceholder={baselineRate}
              altDeviceRateVal={baselineAltRate}
              onAltDeviceRateChange={setBaselineAltRate}
              blendedVal={baselineAltBlendedRate}
              onBlendedChange={setBaselineAltBlendedRate}
              calcBlended={globalRateMode === "device" ? calcAltBlended : null}
              isMobile={isMobile}
            />

            {/* Device cost + devices per patient — below rate row */}
            <div className={`grid gap-4 pt-2 border-t border-[#FFCC66] ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              <InputField
                label="Cost per Device"
                value={baselineAltDeviceCost}
                onChange={(e) => setBaselineAltDeviceCost(e.target.value)}
                type="number"
                prefix="$"
                step="0.01"
                min="0"
                maxDecimals={2}
                fixedDecimals={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Baseline contamination rate — only shown when no alt device is active */}
      {!baselineHasAltProduct && (
        <div className={`grid gap-4 border-t border-[#CBCFD3] pt-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
          <InputField
            label="Baseline Contamination Rate"
            value={baselineRate}
            onChange={(e) => setBaselineRate(e.target.value)}
            type="number"
            suffix="%"
            step="0.01"
            min="0"
            maxDecimals={2}
          />
        </div>
      )}

      {/* Calculated outputs */}
      <div className={`grid gap-4 border-t border-[#CBCFD3] pt-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        <CalculatedField
          label="Implied Contaminations"
          value={formatNumber(Math.round(calculations.baseline.contaminations))}
          suffix="events"
        />
        <CalculatedField
          label="Implied Contamination Cost"
          value={formatCurrencyWhole(calculations.baseline.contaminationCost)}
        />
      </div>
    </div>
  );
}
