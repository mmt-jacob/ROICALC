import { TrendingUp, Info } from "lucide-react";
import { ImpactMetric } from "./ImpactMetric";
import { formatCurrencyWhole, formatNumber } from "@/utils/formatters";

export function InteractiveForecast({
  deviceRate,
  setDeviceRate,
  currentRate,
  utilization,
  setUtilization,
  calculations,
}) {
  const maxRate = Number(currentRate) + 1;

  return (
    <div className="bg-[#1E293B] text-white rounded-2xl p-8 shadow-xl flex flex-col justify-between">
      <div>
        <h3 className="text-2xl font-bold mb-6 leading-tight">
          Project Annual Impact
        </h3>

        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-300">
                Expected Contamination Rate Using Steripath®
              </span>
              <span className="text-2xl font-bold text-blue-400">
                {deviceRate}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={maxRate}
              step="0.05"
              value={deviceRate}
              onChange={(e) => setDeviceRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-tighter">
              <span>Minimum 0%</span>
              <span>Maximum {maxRate}%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-300">
                Steripath® Utilization Rate
              </span>
              <span className="text-2xl font-bold text-blue-400">
                {utilization}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={utilization}
              onChange={(e) => setUtilization(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-tighter">
              <span>Minimum 0%</span>
              <span>Maximum 100%</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-700">
            <ImpactMetric
              label="Annual Cost Avoidance"
              value={formatCurrencyWhole(calculations.impact.netSavings)}
            />
            <ImpactMetric
              label="ROI Percentage"
              value={`${Math.round(calculations.impact.roi)}%`}
            />
            <ImpactMetric
              label="Contaminations Avoided"
              value={formatNumber(calculations.impact.contaminationsAvoided)}
            />
            <ImpactMetric
              label="Bed Days Freed"
              value={formatNumber(calculations.impact.bedDaysFreed)}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex items-start gap-3">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed italic">
          Adjust the contamination rate and utilization rate to model clinical
          performance and adoption following implementation of Steripath®.
        </p>
      </div>
    </div>
  );
}
