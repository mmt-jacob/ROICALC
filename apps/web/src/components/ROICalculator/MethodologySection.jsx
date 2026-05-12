import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function MethodologySection({
  isMethodologyOpen,
  setIsMethodologyOpen,
}) {
  return (
    <section className="bg-white rounded-2xl border border-[#CBCFD3] overflow-hidden shadow-sm">
      <button
        onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
        className="w-full px-8 py-4 flex items-center justify-between hover:bg-[#F2F6F7] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Info className="text-[#636D78]" size={18} />
          <span className="font-semibold text-[#636D78]">
            Calculation Methodology &amp; Disclosures
          </span>
        </div>
        {isMethodologyOpen ? (
          <ChevronUp size={20} />
        ) : (
          <ChevronDown size={20} />
        )}
      </button>

      <AnimatePresence>
        {isMethodologyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 border-t border-[#CBCFD3] text-sm text-[#636D78] space-y-6">
              <div>
                <strong className="text-[#151F26] block mb-2 text-base">
                  Scenario Definitions:
                </strong>
                <div className="space-y-2 text-sm leading-relaxed text-[#636D78]">
                  <p>
                    <strong>Scenario 1 – Pre-Steripath® Baseline:</strong> No
                    diversion device in use. All cultures drawn at the baseline
                    contamination rate.
                  </p>
                  <p>
                    <strong>Scenario 2 – Steripath® Implemented:</strong>{" "}
                    Blended outcome reflecting actual Steripath® utilization and contamination performance.
                    Enter the observed blended rate directly, or switch to Device-Specific mode to enter
                    the Steripath®-specific rate (blended is then calculated automatically).
                  </p>
                  <p>
                    <strong>
                      Scenario 3 – Increased Steripath Compliance (With Steripath®):
                    </strong>{" "}
                    Same device economics as Scenario 2, but using your target contamination rate and
                    utilization. Represents the clinical and financial opportunity still available.
                    Supports the same rate input modes as Scenario 2.
                  </p>
                </div>
              </div>

              <div>
                <strong className="text-[#151F26] block mb-3 text-base">
                  Key Formulas:
                </strong>
                <div className="bg-[#F2F6F7] p-4 rounded-lg space-y-3 font-mono text-xs">
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Baseline Contaminations:
                    </div>
                    <div className="text-[#636D78]">
                      Annual Volume × (Baseline Rate / 100)
                    </div>
                  </div>
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Blended Contaminations (Scenarios 2–3):
                    </div>
                    <div className="text-[#636D78]">
                      (Volume × Utilization% × Device Rate%) + (Volume × (1 −
                      Utilization%) × Baseline Rate%)
                    </div>
                  </div>
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Device Investment:
                    </div>
                    <div className="text-[#636D78]">
                      Volume × Utilization% × Devices per Culture × Cost per
                      Device
                    </div>
                  </div>
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Total Hospital Cost:
                    </div>
                    <div className="text-[#636D78]">
                      (Blended Contaminations × Cost per Event) + Device
                      Investment
                    </div>
                  </div>
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Net Annual Savings vs. Baseline:
                    </div>
                    <div className="text-[#636D78]">
                      Baseline Total Cost − Scenario Total Cost
                    </div>
                  </div>
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Annual Cost Avoidance (Executive Summary):
                    </div>
                    <div className="text-[#636D78]">
                      Scenario A Total Cost − Scenario B Total Cost
                    </div>
                    <div className="text-[#9AA1AA] text-[11px] mt-1 leading-relaxed">
                      Reflects the net difference in total hospital cost (contaminations + device investment)
                      between the two scenarios selected in the Executive Summary comparison dropdowns.
                      Positive values indicate cost avoidance; negative values indicate higher cost under
                      the selected comparison.
                    </div>
                  </div>
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Return on Investment:
                    </div>
                    <div className="text-[#636D78]">
                      (Gross Cost Reduction − Device Investment) / Device
                      Investment × 100
                    </div>
                  </div>
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Bed Days Freed:
                    </div>
                    <div className="text-[#636D78]">
                      (Baseline Contaminations − Scenario Contaminations) ×
                      Extended LOS per Event
                    </div>
                  </div>
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Payback Period:
                    </div>
                    <div className="text-[#636D78]">
                      Device Investment ÷ (Gross Contamination Savings / Analysis Period)
                    </div>
                    <div className="text-[#9AA1AA] text-[11px] mt-1 leading-relaxed">
                      Gross Contamination Savings = Baseline Contamination Cost − Scenario Contamination Cost.
                      The Analysis Period (General Assumptions) sets the time window — default 12 months.
                      Payback answers: how many periods of contamination cost avoidance does it take to
                      cover the device investment? A payback of 3 at the default 12-month period means
                      the device pays for itself in about one quarter.
                    </div>
                  </div>
                  <div>
                    <div className="text-[#636D78] font-semibold mb-1">
                      Blended Contamination Rate (Scenarios 2–3):
                    </div>
                    <div className="text-[#636D78]">
                      (Utilization% × Device Rate%) + ((1 − Utilization%) × Baseline Rate%)
                    </div>
                    <div className="text-[#9AA1AA] text-[11px] mt-1 leading-relaxed">
                      Because not every blood culture draw uses a diversion device, reported contamination
                      events and costs reflect a weighted mix: cultures drawn with the device at its
                      contamination rate, plus cultures drawn without the device at the baseline rate.
                      The "Eff. rate" shown in the table is this blended effective contamination rate.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#CBCFD3]">
                <strong className="text-[#151F26] block mb-3 text-base">
                  Changelog:
                </strong>
                <div className="space-y-4 text-xs leading-relaxed">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0842A6] text-white">v2.0</span>
                      <span className="font-semibold text-[#151F26]">April 2026 — Current Version</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[#636D78] pl-1">
                      <li>Expanded to three-scenario comparative model (Baseline, Steripath® Implemented, Increased Steripath Compliance)</li>
                      <li>Added Increased Steripath Compliance scenario: quantify remaining clinical and financial opportunity</li>
                      <li>Clinical results section: Contaminations Avoided, Bed Days Freed, Excess Mortality Risk Reduction, AKI Events Avoided, Antibiotic Treatment Days</li>
                      <li>Global rate input mode toggle: Blended Rate or Device-Specific across all scenarios</li>
                      <li>Baseline alt-device support: full 4-column rate row matching Steripath® scenario logic</li>
                      <li>Account name autocomplete with 7,000+ MMT customer accounts</li>
                      <li>Account Utilization button: one-click link to Tableau utilization dashboard for the selected account</li>
                      <li>Export/import calculator inputs as JSON for saving and sharing sessions</li>
                      <li>PDF export redesigned with MMT branding, clinical + financial KPI cards, and scenario comparison table</li>
                      <li>Investment comparison bar: visualizes cost avoided per dollar invested</li>
                      <li>Mobile view with simulated phone frame for presentation use</li>
                      <li>Full MMT brand color system applied throughout</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9AA1AA] text-white">v1.0</span>
                      <span className="font-semibold text-[#151F26]">Original Release</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[#636D78] pl-1">
                      <li>Single-scenario ROI calculator: baseline vs. Steripath®</li>
                      <li>Executive summary cards: net savings, ROI, payback period, contaminations avoided, bed days freed</li>
                      <li>Key formula disclosures and clinical references</li>
                      <li>PDF export of summary results</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#CBCFD3]">
                <strong className="text-[#151F26] block mb-3 text-base">
                  References:
                </strong>
                <div className="space-y-2 text-xs leading-relaxed">
                  <p>
                    <sup>1</sup>Klucher J, Davis K, Lakkad M, Painter JT, Dare
                    RK. Risk factors and clinical outcomes associated with blood
                    culture contamination.{" "}
                    <em>Infect Control Hosp Epidemiol.</em> 2022;43(3):291-297.
                    doi:10.1017/ice.2021.111.
                  </p>
                  <p>
                    <sup>2</sup>Geisler BP, Jilg N, Patton RG, Pietzsch JB.
                    Model to evaluate the impact of hospital-based interventions
                    targeting false-positive blood cultures on economic and
                    clinical outcomes. <em>J Hosp Infect.</em>{" "}
                    2019;102(4):438-444. doi:10.1016/j.jhin.2019.03.012.
                  </p>
                  <p>
                    <sup>3</sup>Skoglund E, Dempsey CJ, Chen H, Garey KW.
                    Estimated clinical and economic impact through use of a
                    novel blood collection device to reduce blood culture
                    contamination in the emergency department: a cost-benefit
                    analysis. <em>J Clin Microbiol.</em> 2019;57(1):e01015-18.
                    doi:10.1128/JCM.01015-18.
                  </p>
                  <p>
                    <sup>4</sup>Alahmadi YM, Aldeyab MA, McElnay JC, et al.
                    Clinical and economic impact of contaminated blood cultures
                    within the hospital setting. <em>J Hosp Infect.</em>{" "}
                    2011;77(3):233-6. doi:10.1016/j.jhin.2010.09.033.
                  </p>
                  <p>
                    <sup>5</sup>Gander RM, Byrd L, DeCrescenzo M, Hirany S,
                    Bowen M, Baughman J. Impact of phlebotomy-drawn blood
                    cultures on contamination rates and health care costs in a
                    hospital emergency department. <em>J Clin Microbiol.</em>{" "}
                    2009;47(4):1021-4. doi:10.1128/JCM.02162-08.
                  </p>
                  <p>
                    <sup>6</sup>Zwang O, Albert RK. Analysis of strategies to
                    improve cost effectiveness of blood cultures.{" "}
                    <em>J Hosp Med.</em> 2006;1(5):272-6. doi:10.1002/jhm.115.
                  </p>
                  <p>
                    <sup>7</sup>Little JR, Murray PR, Traynor PS, Spitznagel E.
                    A randomized trial of povidone-iodine compared with iodine
                    tincture for venipuncture site disinfection: effects on
                    rates of blood culture contamination. <em>Am J Med.</em>{" "}
                    1999;107(2):119-25. doi:10.1016/s0002-9343(99)00197-7.
                  </p>
                  <p>
                    <sup>8</sup>Surdulescu S, Utamsingh D, and Shekar S.
                    Phlebotomy teams reduce blood-culture contamination rate and
                    save money. <em>Clin Perform Qual Health Care.</em>{" "}
                    1998;6(2):60-2.
                  </p>
                  <p>
                    <sup>9</sup>Bates DW, Goldman L, Lee TH. Contaminant blood
                    cultures and resource utilization. The true consequences of
                    false-positive results. <em>JAMA.</em> 1991;265(3):365-9.
                    doi:10.1001/jama.1991.03460030071031.
                  </p>
                  <p>
                    <sup>10</sup>Dunagan WC, Woodward RS, Medoff G, et al.
                    Antimicrobial misuse in patients with positive blood
                    cultures. <em>Am J Med.</em> 1989;87(3):253-9.
                    doi:10.1016/s0002-9343(89)80146-9.
                  </p>
                  <p className="mt-3 text-[10px] text-[#9AA1AA]">
                    *Adjusted by a 40% cost-to-charge ratio and then inflation
                    adjusted using CPI Inflation Calculator from June year of
                    publication to June 2019. Did not adjust 2022 study given
                    recency.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
