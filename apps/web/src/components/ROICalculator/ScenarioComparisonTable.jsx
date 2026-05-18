import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrencyCompact, formatNumber } from "@/utils/formatters";

const SCENARIOS = {
  baseline: {
    key: "baseline",
    label: "Pre-Steripath® Baseline",
    sublabel: "Your starting point before Steripath®",
    headerBg: "bg-[#F2F6F7]",
    labelColor: "text-[#636D78]",
  },
  current: {
    key: "current",
    label: "Steripath® Implemented",
    sublabel: "Your facility's performance with Steripath®",
    headerBg: "bg-[#E8F2FF]",
    labelColor: "text-[#0B2D71]",
  },
  best: {
    key: "best",
    label: "Increased Steripath® Compliance",
    sublabel: "Benefits of Increased Steripath® Compliance",
    headerBg: "bg-[#E6F8F4]",
    labelColor: "text-[#056B50]",
  },
};

function fmtValue(val, key, { isCurrency, isRate, isAvoidance, hideBaseline }) {
  if (val === null) return "—";
  if (hideBaseline && key === "baseline") return "—";
  if (key === "baseline" && isAvoidance) return "—";
  if (isCurrency) return formatCurrencyCompact(val);
  if (isRate) return `${(Number(val) || 0).toFixed(2)}%`;
  return formatNumber(Math.round(val));
}

function fmtDelta(delta, { isCurrency, isRate }) {
  const threshold = isRate ? 0.001 : 0.5;
  if (Math.abs(delta) < threshold) return "—";
  const sign = delta >= 0 ? "+" : "–";
  const abs = Math.abs(delta);
  if (isCurrency) return `${sign}${formatCurrencyCompact(abs)}`;
  if (isRate) return `${sign}${abs.toFixed(2)}%`;
  return `${sign}${formatNumber(Math.round(abs))}`;
}

function MetricRow({ label, sublabel, values, rowIndex, compareA, compareB, isCurrency, isRate, isAvoidance, hideBaseline, isMobile, positiveIsGood, noColor }) {
  const rowDef = { isCurrency, isRate, isAvoidance, hideBaseline };
  const valA = values[compareA] ?? null;
  const valB = values[compareB] ?? null;

  const numA = (hideBaseline && compareA === "baseline") || (isAvoidance && compareA === "baseline") ? 0 : (Number(valA) || 0);
  const numB = Number(valB) || 0;
  const delta = numB - numA;
  const deltaStr = fmtDelta(delta, rowDef);

  const baseCellCls = `text-center border-b border-[#CBCFD3] align-middle font-bold ${isMobile ? "py-2 px-3 text-sm" : "py-3 px-5 text-base"}`;
  const cellCls = baseCellCls + " text-[#151F26]";

  let deltaColor;
  if (noColor || deltaStr === "—") {
    deltaColor = "text-[#9AA1AA]";
  } else {
    const isGood = positiveIsGood ? delta > 0 : delta < 0;
    deltaColor = isGood ? "text-green-600" : "text-red-600";
  }

  return (
    <tr className={rowIndex % 2 === 0 ? "bg-white" : "bg-[#F2F6F7]"}>
      <td className={`border-b border-[#CBCFD3] align-middle ${isMobile ? "py-2 px-3" : "py-3 px-5"}`}>
        <span className={`font-semibold text-[#151F26] ${isMobile ? "text-sm" : "text-base"}`}>{label}</span>
        {sublabel && !isMobile && (
          <p className="text-sm text-[#9AA1AA] mt-0.5 leading-snug">{sublabel}</p>
        )}
      </td>
      <td className={cellCls}>{fmtValue(valA, compareA, rowDef)}</td>
      <td className={cellCls}>{fmtValue(valB, compareB, rowDef)}</td>
      <td className={baseCellCls + " " + deltaColor}>{deltaStr}</td>
    </tr>
  );
}

export function ScenarioComparisonTable({ calculations, showBestScenario = true, isMobile, inputs = {}, compareA = "baseline", compareB = "current" }) {
  const { baseline, current, best } = calculations;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const scenA = SCENARIOS[compareA];
  const scenB = SCENARIOS[compareB];
  const metricColPct = 32;
  const dataColPct = (100 - metricColPct) / 3;

  const rows = [
    {
      label: "Avoided Contamination Events",
      sublabel: "False-positive cultures avoided vs. Pre-Steripath® Baseline",
      values: { baseline: 0, current: Math.max(0, baseline.contaminations - current.contaminations), best: Math.max(0, baseline.contaminations - best.contaminations) },
      isAvoidance: true, positiveIsGood: true,
    },
    {
      label: "Blended Contamination Rate",
      sublabel: "Contamination rate weighted by Utilization Rate",
      values: { baseline: baseline.blendedRate, current: current.blendedRate, best: best.blendedRate },
      isRate: true, positiveIsGood: false,
    },
    {
      label: "Cost of Contaminations",
      sublabel: "Direct cost burden from false-positive cultures",
      values: { baseline: baseline.contaminationCost, current: current.contaminationCost, best: best.contaminationCost },
      isCurrency: true, positiveIsGood: false,
    },
    {
      label: "Device Investment",
      sublabel: "Total device cost",
      values: { baseline: inputs.baselineHasAltProduct ? baseline.deviceCost : 0, current: current.deviceCost, best: best.deviceCost },
      isCurrency: true,
      hideBaseline: !inputs.baselineHasAltProduct,
      noColor: true,
    },
    {
      label: "Total Hospital Cost",
      sublabel: "Contamination costs + device investment combined",
      values: { baseline: baseline.totalCost, current: current.totalCost, best: best.totalCost },
      isCurrency: true, positiveIsGood: false,
    },
    {
      label: "Net Savings",
      sublabel: "Cost avoided relative to Pre-Steripath® Baseline, after device investment",
      values: { baseline: 0, current: current.netSavings, best: best.netSavings },
      isAvoidance: true, isCurrency: true, positiveIsGood: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#CBCFD3] shadow-sm overflow-hidden">
      <button
        onClick={() => setIsCollapsed((v) => !v)}
        className="w-full px-8 py-5 border-b border-[#CBCFD3] flex items-center justify-between hover:bg-[#F2F6F7] transition-colors"
      >
        <div className="text-left">
          <h2 className="text-lg font-bold text-[#151F26]">Scenario Comparison</h2>
          {!isCollapsed && (
            <p className="text-sm text-[#636D78] mt-1">
              All figures reflect estimated impact. The Change column shows the difference between the two selected scenarios.
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 text-[#636D78]">
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </button>

      {!isCollapsed && (
        <div className={`overflow-x-auto overflow-y-auto ${isMobile ? "max-h-[55vh]" : "max-h-[70vh]"}`}>
          <table className={`border-collapse ${isMobile ? "w-max min-w-full" : "w-full"}`}>
            <thead>
              <tr>
                <th
                  className={`sticky top-0 z-10 bg-white text-left text-xs font-semibold text-[#9AA1AA] uppercase tracking-wider border-b border-[#CBCFD3] ${isMobile ? "py-2 px-3 min-w-[120px]" : "py-4 px-5"}`}
                  style={!isMobile ? { width: `${metricColPct}%` } : undefined}
                >
                  Metric
                </th>
                {[scenA, scenB].map((s) => (
                  <th
                    key={s.key}
                    className={`sticky top-0 z-10 text-center border-b border-[#CBCFD3] ${isMobile ? "py-2 px-3 min-w-[110px]" : "py-4 px-5"} ${s.headerBg}`}
                    style={!isMobile ? { width: `${dataColPct}%` } : undefined}
                  >
                    <div className={`font-bold ${s.labelColor} leading-snug ${isMobile ? "text-xs" : "text-base"}`}>
                      {isMobile ? s.label.replace("Pre-Steripath® ", "") : s.label}
                    </div>
                    {!isMobile && (
                      <div className="text-sm text-slate-400 font-normal mt-1 leading-snug">{s.sublabel}</div>
                    )}
                  </th>
                ))}
                <th
                  className={`sticky top-0 z-10 bg-[#F8F9FA] text-center border-b border-[#CBCFD3] ${isMobile ? "py-2 px-3 min-w-[90px]" : "py-4 px-5"}`}
                  style={!isMobile ? { width: `${dataColPct}%` } : undefined}
                >
                  <div className={`font-bold text-[#151F26] leading-snug ${isMobile ? "text-xs" : "text-base"}`}>Change</div>
                  {!isMobile && (
                    <div className="text-sm text-slate-400 font-normal mt-1 leading-snug">vs. {scenA.label}</div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <MetricRow
                  key={i}
                  {...row}
                  rowIndex={i}
                  compareA={compareA}
                  compareB={compareB}
                  isMobile={isMobile}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
