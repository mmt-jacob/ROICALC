import { useState, useRef } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { InputField } from "./InputField";
import { CalculatedField } from "./CalculatedField";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-[#08B28F]" : "bg-[#CBCFD3]"
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

// Stable top-level component — must NOT be defined inside ScenarioInputs or React will
// remount it on every render, causing inputs to lose focus after each keystroke.
function RateRow({
  mode, utilVal, onUtilChange, utilLabel,
  nonSteripathVal, onNonSteripathChange, baselinePlaceholder,
  steripathVal, onSteripathChange,
  blendedVal, onBlendedChange,
  calcBlended,
  isMobile,
}) {
  const [utilError, setUtilError] = useState(null);
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
      {/* Col 1 — Utilization (always manual) */}
      <div>
        <InputField
          label={utilLabel}
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
          {/* Device mode Col 2 — Steripath® Rate (before non-Steripath) */}
          <InputField
            label="Steripath® Contamination Rate"
            value={steripathVal}
            onChange={(e) => onSteripathChange(e.target.value)}
            type="number"
            suffix="%"
            step="0.01"
            min="0"
            maxDecimals={2}
          />

          {/* Device mode Col 3 — Non-Steripath® Rate */}
          {atMaxUtil ? (
            <CalculatedField
              label="Non-Steripath® Contamination Rate"
              value="N/A"
            />
          ) : (
            <InputField
              label="Non-Steripath® Contamination Rate"
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

export function ScenarioInputs({
  globalRateMode,
  steripathDeviceCost,
  setSteripathDeviceCost,
  steripathDevicesPerCulture,
  setSteripathDevicesPerCulture,
  // Scenario 2 — Steripath Implemented
  steripathUtilization,
  setSteripathUtilization,
  currentSteripathRate,
  setCurrentSteripathRate,
  currentBlendedRate,
  setCurrentBlendedRate,
  currentCalcBlendedRate,
  currentNonSteripathRate,
  setCurrentNonSteripathRate,
  // Scenario 3 — Increased Steripath Compliance
  bestSteripathRate,
  setBestSteripathRate,
  bestSteripathUtilization,
  setBestSteripathUtilization,
  bestBlendedRate,
  setBestBlendedRate,
  bestCalcBlendedRate,
  bestNonSteripathRate,
  setBestNonSteripathRate,
  showBestScenario,
  setShowBestScenario,
  baselineRate,
  isMobile,
}) {
  return (
    <div className={`bg-gradient-to-br from-[#EAF3FF] to-[#D5E9FF] rounded-2xl border border-[#99CCFF] shadow-sm space-y-6 ${isMobile ? "p-5" : "p-8"}`}>
      <div className="flex items-center gap-3 border-b border-[#99CCFF] pb-4">
        <ShieldCheck className="text-[#0B2D71]" size={20} />
        <h2 className="font-bold text-lg text-[#0B2D71]">
          Steripath® Implementation
        </h2>
      </div>

      {/* Scenario 2 — Steripath Implemented */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white bg-[#0842A6]">
            2
          </span>
          <div>
            <h2 className="font-bold text-lg text-[#0B2D71]">Steripath® Implemented</h2>
            <p className="text-xs text-[#0061D5] mt-0.5">Scenario 2</p>
          </div>
        </div>

        <RateRow
          mode={globalRateMode || "blended"}
          utilVal={steripathUtilization}
          onUtilChange={setSteripathUtilization}
          utilLabel="Utilization Rate"
          nonSteripathVal={currentNonSteripathRate}
          onNonSteripathChange={setCurrentNonSteripathRate}
          baselinePlaceholder={baselineRate}
          steripathVal={currentSteripathRate}
          onSteripathChange={setCurrentSteripathRate}
          blendedVal={currentBlendedRate}
          onBlendedChange={setCurrentBlendedRate}
          calcBlended={currentCalcBlendedRate}
          isMobile={isMobile}
        />
      </div>

      {/* Scenario 3 — Increased Steripath Compliance */}
      <div className={`border-t border-[#99CCFF] ${showBestScenario ? "pt-2" : "pt-3"}`}>
        <div className={`flex items-center justify-between ${showBestScenario ? "mb-4" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white bg-[#08B28F]">
              3
            </span>
            <div>
              <h2 className="font-bold text-lg text-[#056B50]">Increased Steripath Compliance</h2>
              <p className="text-xs text-[#08B28F] mt-0.5">Scenario 3</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {showBestScenario ? "Included" : "Hidden"}
            </span>
            <Toggle checked={showBestScenario} onChange={setShowBestScenario} />
          </div>
        </div>

        {showBestScenario && (() => {
          // Effective blended rates for each scenario (mode-aware)
          const sc2Rate = globalRateMode === "blended"
            ? Number(currentBlendedRate) || 0
            : Number(currentCalcBlendedRate) || 0;
          const sc3Rate = globalRateMode === "blended"
            ? Number(bestBlendedRate) || 0
            : Number(bestCalcBlendedRate) || 0;
          const sc2Util = Number(steripathUtilization) || 0;
          const sc3Util = Number(bestSteripathUtilization) || 0;

          const showRateWarning = sc3Util > sc2Util && sc3Rate > sc2Rate;

          return (
            <div className="space-y-3">
              <RateRow
                mode={globalRateMode || "blended"}
                utilVal={bestSteripathUtilization}
                onUtilChange={setBestSteripathUtilization}
                utilLabel="Utilization Rate"
                nonSteripathVal={bestNonSteripathRate}
                onNonSteripathChange={setBestNonSteripathRate}
                baselinePlaceholder={baselineRate}
                steripathVal={bestSteripathRate}
                onSteripathChange={setBestSteripathRate}
                blendedVal={bestBlendedRate}
                onBlendedChange={setBestBlendedRate}
                calcBlended={bestCalcBlendedRate}
                isMobile={isMobile}
              />
              {showRateWarning && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
                  <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Please confirm:</strong> Scenario 3 has a higher utilization rate
                    ({sc3Util}%) <em>and</em> a higher contamination rate ({sc3Rate.toFixed(2)}%)
                    than Scenario 2 ({sc2Util}% / {sc2Rate.toFixed(2)}%). Typically, increasing
                    Steripath® compliance would lower the contamination rate. Is this intended?
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Shared device parameters — below rate inputs */}
      <div className={`space-y-3 border-t border-[#99CCFF] pt-4`}>
        <h2 className="font-bold text-base text-[#0B2D71]">Device Parameters</h2>
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
          <InputField
            label="Cost per Device"
            value={steripathDeviceCost}
            onChange={(e) => setSteripathDeviceCost(e.target.value)}
            type="number"
            prefix="$"
            step="0.01"
            min="0"
            maxDecimals={2}
          />
          <InputField
            label="Devices per Culture"
            value={steripathDevicesPerCulture}
            onChange={(e) => setSteripathDevicesPerCulture(Number(e.target.value))}
            type="number"
            min="0"
          />
        </div>
      </div>
    </div>
  );
}
