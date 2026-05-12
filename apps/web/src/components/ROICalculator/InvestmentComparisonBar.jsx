"use client";

import { motion } from "motion/react";
import { formatCurrency } from "@/utils/formatters";

export default function InvestmentComparisonBar({
  grossSavings,
  totalDeviceInvestment,
  showTarget,
  targetGrossSavings,
  targetDeviceInvestment,
}) {
  const returnRatio =
    totalDeviceInvestment > 0 ? Math.max(0, grossSavings / totalDeviceInvestment) : 0;

  // Incremental return for Sc3: contamination savings of going Sc2→Sc3
  // divided by the additional device investment required.
  const targetReturnRatio =
    showTarget && targetDeviceInvestment > 0
      ? Math.max(0, targetGrossSavings / targetDeviceInvestment)
      : 0;

  // Show Sc3's incremental ratio standalone (not as a delta from Sc2's ratio)
  const additionalRatio = targetReturnRatio;

  const maxVisualRatio = 10;
  const visualRatio = Math.min(returnRatio, maxVisualRatio);

  const investmentBarWidth = 40;
  const savingsBarWidth = Math.min(investmentBarWidth * visualRatio, 236);

  return (
    <div className="bg-[#F2F6F7] rounded-xl shadow-sm border-4 border-[#0B2D71] p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-bold text-[#151F26]">
          Cost Avoided for Every Dollar Invested in Steripath®
        </h3>
      </div>

      {/* Comparison Bars */}
      <div className="flex items-center justify-center gap-4 md:gap-12 mb-4 md:mb-6 flex-wrap">
        {/* Investment Bar */}
        <div className="flex flex-col items-center gap-2 md:gap-3">
          <div className="text-center">
            <div className="text-xs md:text-sm font-medium text-[#636D78] mb-1">
              Invest $1
            </div>
          </div>
          <div
            className="h-10 md:h-12 rounded-lg"
            style={{
              width: `${investmentBarWidth}px`,
              background:
                "linear-gradient(135deg, rgba(0, 97, 213, 0.5) 0%, rgba(8, 66, 166, 0.7) 100%)",
              boxShadow: "0 2px 8px rgba(0, 97, 213, 0.2)",
            }}
          />
        </div>

        {/* Sc. 2 Savings Bar */}
        <div className="flex flex-col items-center gap-2 md:gap-3">
          <div className="text-center">
            <div className="text-xs md:text-sm font-medium text-[#636D78] mb-1">
              Avoid {formatCurrency(returnRatio)} Costs{showTarget ? " (Sc. 2)" : ""}
            </div>
          </div>
          <motion.div
            className="h-10 md:h-12 rounded-lg"
            initial={{ width: 0 }}
            animate={{ width: savingsBarWidth }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 97, 213, 0.9) 0%, rgba(8, 66, 166, 1) 100%)",
              boxShadow: "0 4px 12px rgba(0, 97, 213, 0.3)",
              minWidth: "40px",
            }}
          />
        </div>
      </div>

      {/* Target additional text (replaces third bar) */}
      {showTarget && (
        <div className="border-t border-[#CBCFD3] pt-4 text-center">
          <p className="text-xs text-[#636D78] uppercase tracking-wider font-semibold mb-1">
            If Steripath® Compliance is Increased
          </p>
          {targetDeviceInvestment > 0 ? (
            <>
              <p className="text-2xl font-bold text-[#08B28F]">
                {formatCurrency(additionalRatio)}
              </p>
              <p className="text-sm text-[#636D78] mt-0.5">
                cost avoided per additional $1 invested to increase compliance
              </p>
            </>
          ) : (
            <p className="text-sm text-[#636D78] mt-0.5 italic">
              No additional device investment required for Sc. 3
            </p>
          )}
        </div>
      )}
    </div>
  );
}
