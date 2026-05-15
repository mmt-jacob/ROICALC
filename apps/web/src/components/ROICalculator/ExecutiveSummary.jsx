import { DollarSign, Clock, Users, Bed, HeartPulse, Droplets, Pill, Syringe } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { formatCurrencyWhole, formatNumber } from "@/utils/formatters";

const SHOWPAD_LINK =
  "https://magnoliamedical.showpad.biz/webapp2/results?query=Tompkins%20&scope=content,shares&slug=346360c6-df7f-4695-986c-f148f49bf667&source=search-suggestions";

const SHOWPAD_LINK_BED_DAYS =
  "https://magnoliamedical.showpad.biz/webapp2/results?query=4,162&scope=content,shares&slug=ab7eabd8-85ee-4af3-8d06-7522b8ec4a5b&modalPage=8&source=search-suggestions";

const SCENARIO_OPTIONS = [
  { value: "baseline", label: "Sc. 1 – Pre-Steripath® Baseline" },
  { value: "current",  label: "Sc. 2 – Steripath® Implemented" },
  { value: "best",     label: "Sc. 3 – Increased Steripath Compliance" },
];

export function ExecutiveSummary({
  calculations,
  period,
  isMobile,
  compareA,
  setCompareA,
  compareB,
  setCompareB,
  showBestScenario,
}) {
  const activeOptions = SCENARIO_OPTIONS.filter((o) => {
    if (o.value === "best" && !showBestScenario) return false;
    return true;
  });

  const compareAOptions = activeOptions.filter((o) => o.value !== "best");
  const compareAIndex = activeOptions.findIndex((o) => o.value === compareA);
  // B options: only scenarios that come after A in the list
  const compareBOptions = activeOptions.filter((_, i) => i > compareAIndex);

  const handleCompareAChange = (val) => {
    setCompareA(val);
    const newAIndex = activeOptions.findIndex((o) => o.value === val);
    const currentBIndex = activeOptions.findIndex((o) => o.value === compareB);
    // If current B is no longer valid (not higher than new A), advance it
    if (currentBIndex <= newAIndex) {
      const next = activeOptions[newAIndex + 1];
      if (next) setCompareB(next.value);
    }
  };

  const scenA = calculations[compareA] || calculations.baseline;
  const scenB = calculations[compareB] || calculations.current;
  const per = Number(period) || 12;

  // Financial metrics
  const costAvoidance = (scenA.totalCost || 0) - (scenB.totalCost || 0);
  const grossContamSavings = (scenA.contaminationCost || 0) - (scenB.contaminationCost || 0);
  const paybackMonths =
    (scenB.deviceCost || 0) > 0 && grossContamSavings > 0
      ? (scenB.deviceCost / grossContamSavings) * per
      : null;

  // Clinical metrics
  const contamAvoided = Math.max(0, (scenA.contaminations || 0) - (scenB.contaminations || 0));
  const bedDaysFreed   = Math.max(0, (scenA.bedDays || 0) - (scenB.bedDays || 0));
  const mortalityReduction = contamAvoided * 0.034;
  const akiAvoided         = contamAvoided * 0.134;
  const antibioticDays     = contamAvoided * 1;

  const roundedPayback = Math.round(paybackMonths ?? 0);
  const paybackDisplay =
    paybackMonths === null
      ? "N/A"
      : roundedPayback === 0
      ? "< 1 mo."
      : `${roundedPayback} mo.`;

  // Hide payback whenever Sc. 3 is involved in either selector
  const hidePayback = compareA === "best" || compareB === "best";

  const selectCls = [
    "font-semibold border border-[#99CCFF] rounded-lg bg-white text-[#0B2D71]",
    "focus:outline-none focus:ring-2 focus:ring-[#0061D5]/20 cursor-pointer",
    isMobile ? "text-[11px] px-2 py-1" : "text-sm px-3 py-1.5",
  ].join(" ");

  const sectionLabel = (text) => (
    <p className={`font-bold text-center text-[#151F26] mb-4 ${isMobile ? "text-base" : "text-xl"}`}>
      {text}
    </p>
  );

  return (
    <section>
      {/* Scenario comparison selectors */}
      <div className={`flex items-center gap-2 mb-5 flex-wrap ${isMobile ? "text-xs" : ""}`} style={{ rowGap: "0.5rem" }}>
        <span className={`font-semibold text-[#9AA1AA] uppercase tracking-widest ${isMobile ? "text-[10px]" : "text-xs"}`}>
          Comparing
        </span>
        <select value={compareA} onChange={(e) => handleCompareAChange(e.target.value)} className={selectCls}>
          {compareAOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className={`font-semibold text-[#9AA1AA] ${isMobile ? "text-xs" : "text-sm"}`}>vs.</span>
        <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className={selectCls}>
          {compareBOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {!isMobile && (
        <p className="text-sm text-[#1A202C] font-bold mb-4">
          💡 Blue boxes are clickable to view supporting sources &amp; studies
        </p>
      )}

      {/* Clinical Results */}
      {sectionLabel("Clinical Results")}
      <div className={`grid gap-4 mb-6 ${isMobile ? "grid-cols-2" : "grid-cols-4 gap-6"}`}>
        <SummaryCard
          label="Contaminations Avoided"
          value={formatNumber(Math.round(contamAvoided))}
          icon={<Syringe size={isMobile ? 16 : 20} className="text-white" />}
          color="bg-gradient-to-br from-[#0061D5] to-[#0842A6]"
          compact={isMobile}
        />
        <SummaryCard
          label="Potential Mortalities Avoided"
          value={`${formatNumber(Math.round(mortalityReduction))} People`}
          sublabel="contaminations avoided × 3.4%"
          icon={<Users size={isMobile ? 16 : 20} className="text-white" />}
          color="bg-gradient-to-br from-[#0061D5] to-[#0842A6]"
          compact={isMobile}
          href={SHOWPAD_LINK}
          tooltip={`Potentially avoided ${formatNumber(Math.round(mortalityReduction))} ${Math.round(mortalityReduction) === 1 ? "death" : "deaths"} associated with a false positive blood culture contamination`}
        />
        <SummaryCard
          label="AKI Events Avoided"
          value={formatNumber(Math.round(akiAvoided))}
          sublabel="contaminations avoided × 13.4%"
          icon={<Droplets size={isMobile ? 16 : 20} className="text-white" />}
          color="bg-gradient-to-br from-[#0061D5] to-[#0842A6]"
          compact={isMobile}
          href={SHOWPAD_LINK}
        />
        <SummaryCard
          label="Antibiotic Treatment Days Avoided"
          value={formatNumber(Math.round(antibioticDays))}
          sublabel="contaminations avoided × 1 day"
          icon={<Pill size={isMobile ? 16 : 20} className="text-white" />}
          color="bg-gradient-to-br from-[#0061D5] to-[#0842A6]"
          compact={isMobile}
          href={SHOWPAD_LINK}
        />
      </div>

      {/* Financial Results */}
      {sectionLabel("Financial & Operational Results")}
      <div className={`grid gap-4 mb-6 ${isMobile ? "grid-cols-2" : hidePayback ? "grid-cols-2" : "grid-cols-3 gap-6"}`}>
        <SummaryCard
          label="Net Cost Avoidance"
          value={formatCurrencyWhole(costAvoidance)}
          icon={<DollarSign size={isMobile ? 16 : 20} className="text-white" />}
          color="bg-gradient-to-br from-[#0061D5] to-[#0842A6]"
          compact={isMobile}
          href={SHOWPAD_LINK_BED_DAYS}
        />
        {!hidePayback && (
          <SummaryCard
            label="Payback Period"
            value={paybackDisplay}
            icon={<Clock size={isMobile ? 16 : 20} className="text-white" />}
            color="bg-gradient-to-br from-[#0061D5] to-[#0842A6]"
            compact={isMobile}
            href={SHOWPAD_LINK_BED_DAYS}
          />
        )}
        <SummaryCard
          label="Bed Days Freed"
          value={formatNumber(Math.round(bedDaysFreed))}
          icon={<Bed size={isMobile ? 16 : 20} className="text-white" />}
          color="bg-gradient-to-br from-[#0061D5] to-[#0842A6]"
          compact={isMobile}
          fullWidth={isMobile}
          href={SHOWPAD_LINK_BED_DAYS}
        />
      </div>

    </section>
  );
}
