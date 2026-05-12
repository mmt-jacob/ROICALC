import { Settings2 } from "lucide-react";
import { InputField } from "./InputField";

export function HospitalInputs({
  volume,
  setVolume,
  costPerCulture,
  setCostPerCulture,
  losExtension,
  setLosExtension,
  period,
  setPeriod,
  isMobile,
}) {
  return (
    <div className={`bg-gradient-to-br from-[#F2F6F7] to-[#E8ECEE] rounded-2xl border border-[#CBCFD3] shadow-sm space-y-6 ${isMobile ? "p-5" : "p-8"}`}>
      <div className="flex items-center gap-3 border-b border-[#CBD5E1] pb-4">
        <Settings2 className="text-[#64748B]" size={20} />
        <div>
          <h2 className="font-bold text-lg text-[#334155]">
            General Assumptions
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Shared across all scenarios
          </p>
        </div>
      </div>

      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"}`}>
        <InputField
          label="Time Period"
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          type="number"
          suffix="months"
          step="1"
          min="1"
          max="120"
        />
        <InputField
          label="Blood Culture Volume"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          type="number"
          suffix="cultures"
          min="0"
        />
        <InputField
          label="Cost per Contamination Event"
          value={costPerCulture}
          onChange={(e) => setCostPerCulture(e.target.value)}
          type="number"
          prefix="$"
          step="0.01"
          min="0"
          gray
        />
        <InputField
          label="Extended LOS per False Positive"
          value={losExtension}
          onChange={(e) => setLosExtension(e.target.value)}
          type="number"
          suffix="days"
          step="0.1"
          min="0"
          gray
        />
      </div>
    </div>
  );
}
