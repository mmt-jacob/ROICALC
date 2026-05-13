import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { formatCurrencyCompact, formatCurrencyCompactSigned, formatNumber } from "@/utils/formatters";

const SCENARIOS = [
  {
    key: "baseline",
    label: "Pre-Steripath® Baseline",
    sublabel: "Your starting point before Steripath®",
    headerBg: "bg-[#F2F6F7]",
    labelColor: "text-[#636D78]",
    blended: true,
  },
  {
    key: "current",
    label: "Steripath® Implemented",
    sublabel: "Your facility's performance with Steripath®",
    headerBg: "bg-[#E8F2FF]",
    labelColor: "text-[#0B2D71]",
    blended: true,
    refKey: "baseline",
    refLabel: "Baseline",
  },
  {
    key: "best",
    label: "Increased Steripath® Compliance",
    sublabel: "Benefits of Increased Steripath® Compliance",
    headerBg: "bg-[#E6F8F4]",
    labelColor: "text-[#056B50]",
    blended: true,
    refKey: "current",
    refLabel: "Steripath® Implemented",
  },
];

function signedCurrency(v) {
  const n = Number(v) || 0;
  if (n === 0) return "—";
  const formatted = formatCurrencyCompact(Math.abs(n));
  return n >= 0 ? `+${formatted}` : `–${formatted}`;
}

function signedNumber(v) {
  const n = Math.round(Number(v) || 0);
  if (n === 0) return "—";
  const formatted = formatNumber(Math.abs(n));
  return n >= 0 ? `+${formatted}` : `–${formatted}`;
}

function buildDeltaLabel(cellVal, refVal, isCurrency, isRate, refLabel) {
  if (cellVal === null || refVal === null) return null;
  const cell = Number(cellVal) || 0;
  const ref = Number(refVal) || 0;
  const delta = cell - ref;
  const threshold = isRate ? 0.001 : 0.5;
  if (Math.abs(delta) < threshold) return null;
  const sign = delta >= 0 ? "+" : "−";
  const absVal = Math.abs(delta);
  const fmtAbs = isRate
    ? `${absVal.toFixed(2)}%`
    : isCurrency
    ? formatCurrencyCompact(absVal)
    : formatNumber(Math.round(absVal));
  const pctStr =
    !isRate && Math.abs(ref) > 0.5
      ? ` / ${sign}${Math.abs((delta / ref) * 100).toFixed(0)}%`
      : "";
  return `${sign}${fmtAbs}${pctStr} vs. ${refLabel}`;
}

function deltaColor(cellVal, refVal, isSigned, isAvoidance, isRate) {
  if (cellVal === null || refVal === null) return "neutral";
  const delta = (Number(cellVal) || 0) - (Number(refVal) || 0);
  const threshold = isRate ? 0.001 : 0.5;
  if (Math.abs(delta) < threshold) return "neutral";
  const isGood = (isSigned || isAvoidance) ? delta > 0 : delta < 0;
  return isGood ? "good" : "bad";
}

function MetricRow({
  label, sublabel, values, rowIndex,
  isSigned, isCurrency, isRate, isAvoidance,
  activeScenarios, isMobile,
  suppressDeltas,
}) {
  const fmt = (val, key) => {
    if (val === null) return "—";
    if ((key === "baseline" && isSigned) || (key === "baseline" && isAvoidance)) return "—";
    if (isCurrency && isSigned) return signedCurrency(val);
    if (!isCurrency && isSigned) return signedNumber(val);
    if (isCurrency) return formatCurrencyCompact(val);
    if (isRate) return `${(Number(val) || 0).toFixed(2)}%`;
    return formatNumber(Math.round(val));
  };

  const getColor = (val, key) => {
    if (!isSigned || key === "baseline" || isAvoidance) return "text-[#151F26]";
    const n = Number(val) || 0;
    if (n > 0) return "text-[#08B28F] font-bold";
    if (n < 0) return "text-[#F05C47] font-bold";
    return "text-[#636D78]";
  };

  // Deltas appear on columns 2 and 3 (current, best), each vs their left neighbor.
  // Suppress for signed rows only (they are themselves deltas vs baseline).
  const shouldShowDelta = (key) => {
    if (suppressDeltas) return false;
    if (key === "baseline") return false;
    if (isSigned) return false;
    return true;
  };

  return (
    <tr className={rowIndex % 2 === 0 ? "bg-white" : "bg-[#F2F6F7]"}>
      <td className={`border-b border-[#CBCFD3] align-middle ${isMobile ? "py-2 px-3" : "py-3 px-5"}`}>
        <span className={`font-semibold text-[#151F26] ${isMobile ? "text-sm" : "text-base"}`}>{label}</span>
        {sublabel && !isMobile && (
          <p className="text-sm text-[#9AA1AA] mt-0.5 leading-snug">{sublabel}</p>
        )}
      </td>

      {activeScenarios.map((s, si) => {
        const showDelta = shouldShowDelta(s.key);
        const refVal = s.refKey ? values[s.refKey] : null;
        const deltaLabel = showDelta && refVal != null
          ? buildDeltaLabel(values[s.key], refVal, isCurrency, isRate, s.refLabel)
          : null;
        const dColor = showDelta && refVal != null
          ? deltaColor(values[s.key], refVal, isSigned, isAvoidance, isRate)
          : "";

        return [
          /* Spacer to align with arrow header — no visible content in body rows */
          si > 0 && (
            <td
              key={`arrow-${s.key}`}
              className={`border-b border-[#CBCFD3] px-0 ${rowIndex % 2 === 0 ? "bg-white" : "bg-[#F2F6F7]"}`}
              style={{ width: isMobile ? 20 : 28 }}
            />
          ),
          <td
            key={s.key}
            className={`text-center border-b border-[#CBCFD3] align-middle ${isMobile ? "py-2 px-3 text-sm" : "py-3 px-5 text-base"} ${getColor(values[s.key], s.key)}`}
          >
            <div className="font-bold">{fmt(values[s.key], s.key)}</div>
            {deltaLabel && (
              <div
                className={`text-xs mt-1 font-medium leading-tight whitespace-nowrap ${
                  dColor === "bad"
                    ? "text-[#F05C47]"
                    : dColor === "good"
                    ? "text-[#08B28F]"
                    : "text-[#CBCFD3]"
                }`}
              >
                {deltaLabel}
              </div>
            )}
          </td>,
        ];
      })}
    </tr>
  );
}

export function ScenarioComparisonTable({ calculations, showBestScenario = true, isMobile, inputs = {} }) {
  const { baseline, current, best } = calculations;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeScenarios = SCENARIOS.filter((s) => {
    if (s.key === "best" && !showBestScenario) return false;
    return true;
  });

  // Total number of rendered columns: metric + scenarios + arrows between them
  const numArrows = activeScenarios.length - 1;
  // Each scenario column gets equal share of remaining space after the metric column (40%) and arrow columns
  const metricColPct = 32;
  const arrowColPx = isMobile ? 20 : 28;

  const rows = [
    {
      label: "Avoided Contamination Events",
      sublabel: "False-positive cultures avoided vs. Pre-Steripath® Baseline",
      values: {
        baseline: 0,
        current: Math.max(0, baseline.contaminations - current.contaminations),
        best: Math.max(0, baseline.contaminations - best.contaminations),
      },
      isSigned: false,
      isCurrency: false,
      isAvoidance: true,
    },
    {
      label: "Blended Contamination Rate",
      sublabel: "Contamination rate weighted by Utilization Rate",
      values: {
        baseline: baseline.blendedRate,
        current: current.blendedRate,
        best: best.blendedRate,
      },
      isSigned: false,
      isCurrency: false,
      isRate: true,
    },
    {
      label: "Bed Days Freed",
      sublabel: "Estimated bed days freed vs. Pre-Steripath® Baseline",
      values: {
        baseline: 0,
        current: current.bedDaysFreed,
        best: best.bedDaysFreed,
      },
      isSigned: false,
      isAvoidance: true,
      isCurrency: false,
    },
    {
      label: "Cost of Contaminations",
      sublabel: "Direct cost burden from false-positive cultures",
      values: {
        baseline: baseline.contaminationCost,
        current: current.contaminationCost,
        best: best.contaminationCost,
      },
      isSigned: false,
      isCurrency: true,
    },
    {
      label: "Device Investment",
      sublabel: "Total device cost",
      values: {
        baseline: inputs.baselineHasAltProduct ? baseline.deviceCost : null,
        current: current.deviceCost,
        best: best.deviceCost,
      },
      isSigned: false,
      isCurrency: true,
    },
    {
      label: "Total Hospital Cost",
      sublabel: "Contamination costs + device investment combined",
      values: {
        baseline: baseline.totalCost,
        current: current.totalCost,
        best: best.totalCost,
      },
      isSigned: false,
      isCurrency: true,
    },
    {
      label: "Net Savings",
      sublabel: "Cost avoided relative to Pre-Steripath® Baseline, after device investment",
      values: {
        baseline: 0,
        current: current.netSavings,
        best: best.netSavings,
      },
      isSigned: false,
      isAvoidance: true,
      isCurrency: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#CBCFD3] shadow-sm overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setIsCollapsed((v) => !v)}
        className="w-full px-8 py-5 border-b border-[#CBCFD3] flex items-center justify-between hover:bg-[#F2F6F7] transition-colors"
      >
        <div className="text-left">
          <h2 className="text-lg font-bold text-[#151F26]">Scenario Comparison</h2>
          {!isCollapsed && (
            <p className="text-sm text-[#636D78] mt-1">
              All figures reflect estimated impact. Arrows show the direction of comparison —
              each column's delta reflects improvement or change relative to the column to its left.
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
                {/* Metric column */}
                <th
                  className={`sticky top-0 z-10 bg-white text-left text-xs font-semibold text-[#9AA1AA] uppercase tracking-wider border-b border-[#CBCFD3] ${isMobile ? "py-2 px-3 min-w-[120px]" : "py-4 px-5"}`}
                  style={!isMobile ? { width: `${metricColPct}%` } : undefined}
                >
                  Metric
                </th>

                {activeScenarios.map((s, si) => [
                  /* Arrow header between columns */
                  si > 0 && (
                    <th
                      key={`arrow-${s.key}`}
                      className="sticky top-0 z-10 bg-white border-b border-[#CBCFD3] text-center px-0"
                      style={{ width: arrowColPx, minWidth: arrowColPx }}
                    >
                      <ArrowRight size={isMobile ? 12 : 15} className="mx-auto text-[#9AA1AA]" />
                    </th>
                  ),
                  /* Scenario header */
                  <th
                    key={s.key}
                    className={`sticky top-0 z-10 text-center border-b border-[#CBCFD3] ${isMobile ? "py-2 px-3 min-w-[110px]" : "py-4 px-5"} ${s.headerBg}`}
                    style={!isMobile ? { width: `${(100 - metricColPct) / activeScenarios.length}%` } : undefined}
                  >
                    <div className={`font-bold ${s.labelColor} leading-snug ${isMobile ? "text-xs" : "text-base"}`}>
                      {isMobile ? s.label.replace("Pre-Steripath® ", "") : s.label}
                    </div>
                    {!isMobile && (
                      <div className="text-sm text-slate-400 font-normal mt-1 leading-snug">
                        {s.sublabel}
                      </div>
                    )}
                    {s.blended && !isMobile && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-[#CBCFD3] text-[#636D78] uppercase tracking-wide">
                          Blended outcome
                        </span>
                      </div>
                    )}
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <MetricRow key={i} {...row} rowIndex={i} activeScenarios={activeScenarios} isMobile={isMobile} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
