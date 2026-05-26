import { useState, useRef } from "react";
import { InputField } from "./InputField";
import { CalculatedField } from "./CalculatedField";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-[#D4A800]" : "bg-[#CBCFD3]"
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

function RateModePicker({ value, onChange }) {
  const options = [
    { value: "blended", label: "Blended Rate" },
    { value: "device", label: "Device-Specific Rate" },
  ];
  const hints = {
    blended: "Enter the observed blended contamination rate — device rate is derived",
    device: "Enter the device-specific contamination rate — blended rate is calculated automatically",
  };
  return (
    <div>
      <p className="text-xs font-semibold text-[#8B6800] mb-1.5">Rate Input Mode</p>
      <div className="inline-flex rounded-lg border border-[#FFCC66] overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              value === opt.value
                ? "bg-[#D4A800] text-white"
                : "bg-white text-[#8B6800] hover:bg-[#FFFBE8]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-[#B8860B] mt-1">{hints[value]}</p>
    </div>
  );
}

export function CompetitorInputs({
  competitorRate,
  setCompetitorRate,
  competitorDeviceCost,
  setCompetitorDeviceCost,
  competitorUtilization,
  setCompetitorUtilization,
  competitorInputMode,
  setCompetitorInputMode,
  competitorBlendedRate,
  setCompetitorBlendedRate,
  competitorCalcBlendedRate,
  competitorNonSteripathRate,
  setCompetitorNonSteripathRate,
  showAltScenario,
  setShowAltScenario,
  isMobile,
}) {
  const [showUtilWarning, setShowUtilWarning] = useState(false);
  const warningTimerRef = useRef(null);

  const handleUtilChange = (rawVal) => {
    const n = Number(rawVal);
    if (n > 100) {
      setCompetitorUtilization(100);
      setShowUtilWarning(true);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => setShowUtilWarning(false), 10000);
    } else {
      setCompetitorUtilization(n);
    }
  };

  const blendedDisplay = competitorBlendedRate ? Number(competitorBlendedRate).toFixed(2) : "—";
  const atMaxUtil = Number(competitorUtilization) >= 100;

  return (
    <div className={`bg-gradient-to-br from-[#FFFBE8] to-[#FFF5CC] rounded-2xl border border-[#FFCC66] shadow-sm ${isMobile ? "p-5" : "p-8"} ${showAltScenario ? "space-y-6" : ""}`}>
      <div className={`flex items-center justify-between ${showAltScenario ? "border-b border-[#FFCC66] pb-4" : ""}`}>
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white bg-[#D4A800]">
                4
              </span>
              <h2 className="font-bold text-lg text-[#5C4400]">
                Alternative Product
              </h2>
            </div>
            <p className="text-xs text-[#8B6800] mt-0.5">Scenario 4</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {showAltScenario ? "Included" : "Hidden"}
          </span>
          <Toggle checked={showAltScenario} onChange={setShowAltScenario} />
        </div>
      </div>

      {showAltScenario && (
        <div className="space-y-5">
          {/* Device parameters */}
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <InputField
              label="Cost per Device"
              value={competitorDeviceCost}
              onChange={(e) => setCompetitorDeviceCost(e.target.value)}
              type="number"
              prefix="$"
              step="0.01"
              min="0"
            />
          </div>

          <RateModePicker value={competitorInputMode} onChange={setCompetitorInputMode} />

          {/* Rate row: 4 cols — util | non-steripath | device rate | blended */}
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-4"}`}>
            {/* Col 1 — Utilization (always manual) */}
            <div>
              <InputField
                label="Utilization Rate"
                value={competitorUtilization}
                onChange={(e) => handleUtilChange(e.target.value)}
                type="number"
                suffix="%"
                step="1"
                min="0"
                max="100"
              />
              {showUtilWarning && (
                <p className="text-xs text-[#F05C47] font-semibold mt-1 leading-tight">
                  Utilization cannot exceed 100%
                </p>
              )}
            </div>

            {/* Col 2 — Non-Steripath® Contamination Rate */}
            {competitorInputMode === "blended" ? (
              <CalculatedField
                label="Non-Steripath® Contamination Rate"
                value={blendedDisplay}
                suffix="%"
              />
            ) : atMaxUtil ? (
              <CalculatedField
                label="Non-Steripath® Contamination Rate"
                value="N/A"
              />
            ) : (
              <InputField
                label="Non-Steripath® Contamination Rate"
                value={competitorNonSteripathRate}
                onChange={(e) => setCompetitorNonSteripathRate(e.target.value)}
                type="number"
                suffix="%"
                step="0.01"
                min="0"
                maxDecimals={2}
              />
            )}

            {/* Col 3 — Device Rate: input in device mode, derived (= blended) in blended mode */}
            {competitorInputMode === "blended" ? (
              <CalculatedField
                label="Device Contamination Rate"
                value={blendedDisplay}
                suffix="%"
              />
            ) : (
              <InputField
                label="Device Contamination Rate"
                value={competitorRate}
                onChange={(e) => setCompetitorRate(e.target.value)}
                type="number"
                suffix="%"
                step="0.01"
                min="0"
                maxDecimals={2}
              />
            )}

            {/* Col 4 — Blended Rate: input in blended mode, calculated in device mode */}
            {competitorInputMode === "device" ? (
              <CalculatedField
                label="Calculated Blended Rate"
                value={competitorCalcBlendedRate != null ? Number(competitorCalcBlendedRate).toFixed(2) : "—"}
                suffix="%"
              />
            ) : (
              <InputField
                label="Blended Contamination Rate"
                value={competitorBlendedRate}
                onChange={(e) => setCompetitorBlendedRate(e.target.value)}
                type="number"
                suffix="%"
                step="0.01"
                min="0"
                maxDecimals={2}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
