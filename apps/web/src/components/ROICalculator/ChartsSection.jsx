import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Info } from "lucide-react";
import { ChartContainer } from "./ChartContainer";
import { formatCurrencyCompact, formatNumber } from "@/utils/formatters";

const COLORS = {
  baseline: "#9AA1AA",
  current: "#0061D5",
  best: "#08B28F",
  competitor: "#D4A800",
};

const LEGEND = [
  { key: "baseline", label: "Pre-Steripath® Baseline" },
  { key: "current", label: "Current – With Steripath®" },
  { key: "best", label: "Target – With Steripath®" },
  { key: "competitor", label: "Alternative Product" },
];

const SHORT_NAMES = {
  baseline: "Baseline",
  current: "Current\nSteripath®",
  best: "Target",
  competitor: "Alternative\nProduct",
};

const fmtAxisCurrency = (v) => `$${(v / 1_000_000).toFixed(1)}M`;
const fmtAxisNumber = (v) => {
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${Math.round(v)}`;
};
const fmtAxisRate = (v) => `${Number(v).toFixed(1)}%`;

const CHART_CONFIGS = [
  {
    title: "Total Annual Hospital Cost",
    getVal: (s) => s.totalCost,
    fmtAxis: fmtAxisCurrency,
    fmtTooltip: (v) => formatCurrencyCompact(v),
    yWidth: 62,
    avoidedLabel: "Costs Avoided vs. Baseline",
    getAvoided: (b, c) => b.totalCost - c.totalCost,
    fmtAvoided: (v) => formatCurrencyCompact(v),
    getCompDelta: (comp, c) => comp.totalCost - c.totalCost,
    compDeltaLabel: "more in costs vs. current w/ Alt. Product",
  },
  {
    title: "Annual Contamination Events",
    getVal: (s) => s.contaminations,
    fmtAxis: fmtAxisNumber,
    fmtTooltip: (v) => `${formatNumber(Math.round(v))} events`,
    yWidth: 44,
    avoidedLabel: "Contaminations Avoided vs. Baseline",
    getAvoided: (b, c) => b.contaminations - c.contaminations,
    fmtAvoided: (v) => `${formatNumber(Math.round(v))}`,
    getCompDelta: (comp, c) => comp.contaminations - c.contaminations,
    compDeltaLabel: "more contaminations vs. current w/ Alt. Product",
  },
  {
    title: "Annual Bed Days Used",
    getVal: (s) => s.bedDays,
    fmtAxis: fmtAxisNumber,
    fmtTooltip: (v) => `${formatNumber(Math.round(v))} days`,
    yWidth: 44,
    avoidedLabel: "Bed Days Freed vs. Baseline",
    getAvoided: (b, c) => b.bedDays - c.bedDays,
    fmtAvoided: (v) => `${formatNumber(Math.round(v))}`,
    getCompDelta: (comp, c) => comp.bedDays - c.bedDays,
    compDeltaLabel: "more bed days vs. current w/ Alt. Product",
  },
];

function CustomTooltip({ active, payload, formatter }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 p-2 rounded shadow-lg text-sm">
        <p className="font-bold text-slate-700 mb-1">{payload[0].payload.label}</p>
        <p className="text-[#0061D5] font-mono">{formatter(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

const axisStyle = { fontSize: 12, fill: "#9AA1AA" };

function MultiLineTick({ x, y, payload }) {
  const lines = (payload.value || "").split("\n");
  return (
    <text x={x} y={y} textAnchor="middle" fill="#9AA1AA" fontSize={12}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 12 : 14}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

const axisProps = { axisLine: false, tickLine: false, tick: axisStyle };
const barProps = { radius: [6, 6, 0, 0], barSize: 28 };

export function ChartsSection({ calculations, showBestScenario = true, showAltScenario = true, isMobile }) {
  const { baseline, current, best, competitor } = calculations;

  const activeLegend = LEGEND.filter((l) => {
    if (l.key === "best" && !showBestScenario) return false;
    if (l.key === "competitor" && !showAltScenario) return false;
    return true;
  });

  const buildData = (getVal) =>
    Object.entries({ baseline, current, best, competitor })
      .filter(([key]) => {
        if (key === "best" && !showBestScenario) return false;
        if (key === "competitor" && !showAltScenario) return false;
        return true;
      })
      .map(([key, scenario]) => ({
        name: SHORT_NAMES[key],
        label: LEGEND.find((l) => l.key === key)?.label,
        v: getVal(scenario),
        fill: COLORS[key],
      }));

  const chartHeight = isMobile ? 200 : 240;

  return (
    <div className="space-y-4">
      <section className={`grid gap-4 ${isMobile ? "grid-cols-1" : "lg:grid-cols-3"}`}>
        {CHART_CONFIGS.map((cfg) => {
          const data = buildData(cfg.getVal);
          return (
            <ChartContainer key={cfg.title} title={cfg.title}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={data}
                  margin={{ top: 12, right: 4, left: 0, bottom: 16 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" {...axisProps} tick={<MultiLineTick />} height={40} />
                  <YAxis
                    {...axisProps}
                    tickFormatter={cfg.fmtAxis}
                    width={cfg.yWidth}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    content={<CustomTooltip formatter={cfg.fmtTooltip} />}
                  />
                  <Bar dataKey="v" {...barProps}>
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          );
        })}
      </section>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-2">
        {activeLegend.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-sm text-slate-600">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[item.key] }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export function BlendedNote() {
  return (
    <div className="p-4 bg-[#E8F2FF] rounded-xl border border-[#99CCFF] flex items-start gap-3">
      <Info size={16} className="text-[#0842A6] shrink-0 mt-0.5" />
      <p className="text-sm text-slate-700 leading-relaxed">
        <strong>Note:</strong> All device scenarios reflect blended outcomes
        based on their respective utilization rates. For example, at 80%
        utilization, results represent 80% device performance combined with
        20% unprotected baseline performance.
      </p>
    </div>
  );
}
