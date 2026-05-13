import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Download, Upload, Layers } from "lucide-react";
import { useROICalculations } from "@/hooks/useROICalculations";
import { exportToPDF } from "@/utils/exportPDF";
import { Header } from "@/components/ROICalculator/Header";
import { ExecutiveSummary } from "@/components/ROICalculator/ExecutiveSummary";
import { HospitalInputs } from "@/components/ROICalculator/HospitalInputs";
import { BaselineInputs } from "@/components/ROICalculator/BaselineInputs";
import { ScenarioInputs } from "@/components/ROICalculator/ScenarioInputs";
import { ScenarioComparisonTable } from "@/components/ROICalculator/ScenarioComparisonTable";
import { MethodologySection } from "@/components/ROICalculator/MethodologySection";
import { Footer } from "@/components/ROICalculator/Footer";
import { AccountNameInput } from "@/components/ROICalculator/AccountNameInput";
import { StudySelectionModal } from "@/components/ROICalculator/StudySelectionModal";
import { acquireGraphToken, sendEmailViaGraph, getSignedInAccount } from "@/utils/graphMailSender";

function Toggle({ checked, onChange, color = "bg-[#0842A6]" }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? color : "bg-[#CBCFD3]"
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

export default function ROICalculator() {
  // Hospital Name
  const [hospitalName, setHospitalName] = useState("");

  // Session-level settings
  const [isCurrentCustomer, setIsCurrentCustomer] = useState(true);
  const [globalRateMode, setGlobalRateMode] = useState("blended"); // "blended" | "device"

  // General Assumptions
  const [volume, setVolume] = useState(10000);
  const [costPerCulture, setCostPerCulture] = useState("4162");
  const [losExtension, setLosExtension] = useState("3.4");
  const [period, setPeriod] = useState(12);

  // Scenario 1 — Baseline
  const [baselineRate, setBaselineRate] = useState("3.5");
  const [baselineHasAltProduct, setBaselineHasAltProduct] = useState(false);
  // Alt device — device mode inputs
  const [baselineAltRate, setBaselineAltRate] = useState("2.5");
  const [baselineAltNonSteripathRate, setBaselineAltNonSteripathRate] = useState("3.5");
  const [baselineAltNonSteripathOverridden, setBaselineAltNonSteripathOverridden] = useState(false);
  // Alt device — blended mode input
  const [baselineAltBlendedRate, setBaselineAltBlendedRate] = useState("2.8");
  // Shared alt device
  const [baselineAltUtilization, setBaselineAltUtilization] = useState(80);
  const [baselineAltDeviceCost, setBaselineAltDeviceCost] = useState("15.0");
  const [baselineAltDevicesPerCulture, setBaselineAltDevicesPerCulture] = useState(1);

  // Steripath device params (shared Sc. 2 & 3)
  const [steripathDeviceCost, setSteripathDeviceCost] = useState("19.35");
  const [steripathDevicesPerCulture, setSteripathDevicesPerCulture] = useState(1);

  // Scenario 2 — Steripath Implemented
  const [steripathUtilization, setSteripathUtilization] = useState(80);
  const [currentSteripathRate, setCurrentSteripathRate] = useState("1.0");
  const [currentBlendedRate, setCurrentBlendedRate] = useState("1.5");
  const [currentNonSteripathRate, setCurrentNonSteripathRate] = useState("3.5");
  const [currentNonSteripathOverridden, setCurrentNonSteripathOverridden] = useState(false);

  // Scenario 3 — Target
  const [bestSteripathRate, setBestSteripathRate] = useState("0.5");
  const [bestSteripathUtilization, setBestSteripathUtilization] = useState(95);
  const [bestBlendedRate, setBestBlendedRate] = useState("0.8");
  const [bestNonSteripathRate, setBestNonSteripathRate] = useState("3.5");
  const [bestNonSteripathOverridden, setBestNonSteripathOverridden] = useState(false);

  // Comparison selector state for KPI cards
  const [compareA, setCompareA] = useState("baseline");
  const [compareB, setCompareB] = useState("current");

  const showBestScenario = isCurrentCustomer;

  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [scrolledPastInputs, setScrolledPastInputs] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolledPastInputs(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep non-Steripath draw rates in sync with baseline unless user has overridden them
  useEffect(() => {
    if (!currentNonSteripathOverridden) setCurrentNonSteripathRate(baselineRate);
  }, [baselineRate]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!bestNonSteripathOverridden) setBestNonSteripathRate(baselineRate);
  }, [baselineRate]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!baselineAltNonSteripathOverridden) setBaselineAltNonSteripathRate(baselineRate);
  }, [baselineRate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure compareB stays valid when customer status changes
  useEffect(() => {
    if (!isCurrentCustomer && compareA === "best") setCompareA("baseline");
    if (!isCurrentCustomer && compareB === "best") setCompareB("current");
  }, [isCurrentCustomer]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculations = useROICalculations({
    volume,
    baselineRate,
    costPerCulture,
    losExtension,
    period,
    globalRateMode,
    baselineHasAltProduct,
    baselineAltRate,
    baselineAltBlendedRate,
    baselineAltNonSteripathRate,
    baselineAltUtilization,
    baselineAltDeviceCost,
    baselineAltDevicesPerCulture,
    steripathDeviceCost,
    steripathDevicesPerCulture,
    steripathUtilization,
    currentSteripathRate,
    currentBlendedRate,
    currentNonSteripathRate,
    bestSteripathRate,
    bestSteripathUtilization,
    bestBlendedRate,
    bestNonSteripathRate,
  });

  // Derived: computed blended rates (only meaningful in device mode)
  const currentCalcBlendedRate = calculations.current.blendedRate;
  const bestCalcBlendedRate = calculations.best.blendedRate;

  const handleExportInputs = () => {
    const data = {
      hospitalName,
      isCurrentCustomer,
      globalRateMode,
      volume,
      costPerCulture,
      losExtension,
      period,
      baselineRate,
      baselineHasAltProduct,
      baselineAltRate,
      baselineAltBlendedRate,
      baselineAltNonSteripathRate,
      baselineAltUtilization,
      baselineAltDeviceCost,
      baselineAltDevicesPerCulture,
      steripathDeviceCost,
      steripathDevicesPerCulture,
      steripathUtilization,
      currentSteripathRate,
      currentBlendedRate,
      currentNonSteripathRate,
      bestSteripathRate,
      bestSteripathUtilization,
      bestBlendedRate,
      bestNonSteripathRate,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `steripath_inputs${hospitalName ? `_${hospitalName.replace(/\s+/g, "_")}` : ""}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportInputs = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.hospitalName !== undefined) setHospitalName(d.hospitalName);
        if (d.isCurrentCustomer !== undefined) setIsCurrentCustomer(Boolean(d.isCurrentCustomer));
        if (d.globalRateMode !== undefined) setGlobalRateMode(d.globalRateMode === "steripath" ? "device" : d.globalRateMode);
        if (d.volume !== undefined) setVolume(Number(d.volume));
        if (d.costPerCulture !== undefined) setCostPerCulture(d.costPerCulture);
        if (d.losExtension !== undefined) setLosExtension(d.losExtension);
        if (d.period !== undefined) setPeriod(Number(d.period));
        if (d.baselineRate !== undefined) setBaselineRate(d.baselineRate);
        if (d.baselineHasAltProduct !== undefined) setBaselineHasAltProduct(Boolean(d.baselineHasAltProduct));
        if (d.baselineAltRate !== undefined) setBaselineAltRate(d.baselineAltRate);
        if (d.baselineAltBlendedRate !== undefined) setBaselineAltBlendedRate(d.baselineAltBlendedRate);
        if (d.baselineAltNonSteripathRate !== undefined) { setBaselineAltNonSteripathRate(d.baselineAltNonSteripathRate); setBaselineAltNonSteripathOverridden(true); }
        if (d.baselineAltUtilization !== undefined) setBaselineAltUtilization(Number(d.baselineAltUtilization));
        if (d.baselineAltDeviceCost !== undefined) setBaselineAltDeviceCost(d.baselineAltDeviceCost);
        if (d.baselineAltDevicesPerCulture !== undefined) setBaselineAltDevicesPerCulture(Number(d.baselineAltDevicesPerCulture));
        if (d.steripathDeviceCost !== undefined) setSteripathDeviceCost(d.steripathDeviceCost);
        if (d.steripathDevicesPerCulture !== undefined) setSteripathDevicesPerCulture(Number(d.steripathDevicesPerCulture));
        if (d.steripathUtilization !== undefined) setSteripathUtilization(Number(d.steripathUtilization));
        if (d.currentSteripathRate !== undefined) setCurrentSteripathRate(d.currentSteripathRate);
        if (d.currentBlendedRate !== undefined) setCurrentBlendedRate(d.currentBlendedRate);
        if (d.currentNonSteripathRate !== undefined) { setCurrentNonSteripathRate(d.currentNonSteripathRate); setCurrentNonSteripathOverridden(true); }
        if (d.bestSteripathRate !== undefined) setBestSteripathRate(d.bestSteripathRate);
        if (d.bestSteripathUtilization !== undefined) setBestSteripathUtilization(Number(d.bestSteripathUtilization));
        if (d.bestBlendedRate !== undefined) setBestBlendedRate(d.bestBlendedRate);
        if (d.bestNonSteripathRate !== undefined) { setBestNonSteripathRate(d.bestNonSteripathRate); setBestNonSteripathOverridden(true); }
      } catch {
        alert("Invalid file. Please select a valid Steripath inputs file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const [isEmailingPDF, setIsEmailingPDF] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState(() => getSignedInAccount()?.username ?? null);

  const pdfInputs = {
    volume,
    baselineRate,
    baselineHasAltProduct,
    baselineAltRate,
    baselineAltBlendedRate,
    baselineAltNonSteripathRate,
    baselineAltUtilization,
    baselineAltDeviceCost,
    baselineAltDevicesPerCulture,
    costPerCulture,
    losExtension,
    period,
    globalRateMode,
    steripathDeviceCost,
    steripathDevicesPerCulture,
    steripathUtilization,
    currentSteripathRate,
    currentBlendedRate,
    currentNonSteripathRate,
    bestSteripathRate,
    bestSteripathUtilization,
    bestBlendedRate,
    bestNonSteripathRate,
    isCurrentCustomer,
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await exportToPDF({ inputs: pdfInputs, calculations, showBestScenario, hospitalName });
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Unable to generate PDF. Please try again or contact support if the issue persists.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Opens the study selection modal
  const handleEmailPDF = () => setShowStudyModal(true);

  // Called when the user confirms the modal
  const handleEmailPDFConfirm = async (selectedStudies, emailBody, recipientEmail) => {
    setIsEmailingPDF(true);
    try {
      console.log("[Email] Step 1: acquiring token...");
      const accessToken = await acquireGraphToken();
      console.log("[Email] Step 2: token acquired", !!accessToken);
      const account = getSignedInAccount();
      if (account) setSignedInEmail(account.username);

      console.log("[Email] Step 3: generating PDF...");
      const { blob, fileName } = await exportToPDF({
        inputs: pdfInputs, calculations, showBestScenario, hospitalName, returnBlob: true,
      });
      console.log("[Email] Step 4: PDF ready", fileName);

      const subject = `Steripath® Impact Analysis${hospitalName ? ` — ${hospitalName}` : ""}`;

      console.log("[Email] Step 5: sending via Graph API...");
      await sendEmailViaGraph({
        accessToken,
        to: recipientEmail,
        subject,
        bodyText: emailBody,
        pdfBlob: blob,
        pdfName: fileName,
        studies: selectedStudies,
      });

      setShowStudyModal(false);
      alert("Email sent successfully!");
    } catch (err) {
      console.error("Error sending email — full error:", err);
      console.error("Error name:", err?.name, "| message:", err?.message, "| code:", err?.errorCode);
      alert(`Unable to send email: ${err?.message || err?.errorCode || JSON.stringify(err)}`);
    } finally {
      setIsEmailingPDF(false);
    }
  };

  // Calculator settings card (Rate Mode only)
  const settingsCard = (
    <div className="bg-white rounded-2xl border border-[#CBCFD3] shadow-sm px-6 py-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-[#636D78]" />
          <span className="text-sm font-bold text-[#334155]">Contamination Rates Provided</span>
          <span className="text-xs text-[#9AA1AA]">— applies across all scenarios</span>
        </div>
        <div className="inline-flex rounded-lg border border-[#99CCFF] overflow-hidden">
          <button
            type="button"
            onClick={() => setGlobalRateMode("blended")}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              globalRateMode === "blended"
                ? "bg-[#0842A6] text-white"
                : "bg-white text-[#0842A6] hover:bg-[#EAF3FF]"
            }`}
          >
            Blended Rate
          </button>
          <button
            type="button"
            onClick={() => setGlobalRateMode("device")}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              globalRateMode === "device"
                ? "bg-[#0842A6] text-white"
                : "bg-white text-[#0842A6] hover:bg-[#EAF3FF]"
            }`}
          >
            Device-Specific
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2F6F7] text-[#151F26] font-sans pb-12">
      {showStudyModal && (
        <StudySelectionModal
          onConfirm={handleEmailPDFConfirm}
          onClose={() => { setShowStudyModal(false); setIsEmailingPDF(false); }}
          calculations={calculations}
          hospitalName={hospitalName}
          showBestScenario={showBestScenario}
          period={period}
          inputs={pdfInputs}
          isSending={isEmailingPDF}
          signedInEmail={signedInEmail}
        />
      )}
      <Header
        onGeneratePDF={handleGeneratePDF}
        isGeneratingPDF={isGeneratingPDF}
        onEmailPDF={handleEmailPDF}
        isEmailingPDF={isEmailingPDF}
        mobileView={mobileView}
        onToggleMobileView={() => setMobileView((v) => !v)}
        hospitalName={hospitalName}
      />

      {(() => {
        const inputContent = (
          <>
            <div className="bg-white rounded-2xl border border-[#CBCFD3] shadow-sm px-6 py-4">
              <label className="block text-sm font-semibold text-[#636D78] mb-1.5">
                Facility / IDN / System Name
              </label>
              <AccountNameInput value={hospitalName} onChange={setHospitalName} />
            </div>
            {settingsCard}
            <HospitalInputs
              volume={volume}
              setVolume={setVolume}
              costPerCulture={costPerCulture}
              setCostPerCulture={setCostPerCulture}
              losExtension={losExtension}
              setLosExtension={setLosExtension}
              period={period}
              setPeriod={setPeriod}
              isMobile={mobileView}
            />
            <BaselineInputs
              baselineRate={baselineRate}
              setBaselineRate={setBaselineRate}
              baselineHasAltProduct={baselineHasAltProduct}
              setBaselineHasAltProduct={setBaselineHasAltProduct}
              baselineAltRate={baselineAltRate}
              setBaselineAltRate={setBaselineAltRate}
              baselineAltBlendedRate={baselineAltBlendedRate}
              setBaselineAltBlendedRate={setBaselineAltBlendedRate}
              baselineAltNonSteripathRate={baselineAltNonSteripathRate}
              setBaselineAltNonSteripathRate={(val) => { setBaselineAltNonSteripathOverridden(true); setBaselineAltNonSteripathRate(val); }}
              baselineAltUtilization={baselineAltUtilization}
              setBaselineAltUtilization={setBaselineAltUtilization}
              baselineAltDeviceCost={baselineAltDeviceCost}
              setBaselineAltDeviceCost={setBaselineAltDeviceCost}
              baselineAltDevicesPerCulture={baselineAltDevicesPerCulture}
              setBaselineAltDevicesPerCulture={setBaselineAltDevicesPerCulture}
              globalRateMode={globalRateMode}
              calculations={calculations}
              isMobile={mobileView}
            />
            <ScenarioInputs
              globalRateMode={globalRateMode}
              steripathDeviceCost={steripathDeviceCost}
              setSteripathDeviceCost={setSteripathDeviceCost}
              steripathDevicesPerCulture={steripathDevicesPerCulture}
              setSteripathDevicesPerCulture={setSteripathDevicesPerCulture}
              steripathUtilization={steripathUtilization}
              setSteripathUtilization={setSteripathUtilization}
              currentSteripathRate={currentSteripathRate}
              setCurrentSteripathRate={setCurrentSteripathRate}
              currentBlendedRate={currentBlendedRate}
              setCurrentBlendedRate={setCurrentBlendedRate}
              currentCalcBlendedRate={currentCalcBlendedRate}
              currentNonSteripathRate={currentNonSteripathRate}
              setCurrentNonSteripathRate={(val) => { setCurrentNonSteripathOverridden(true); setCurrentNonSteripathRate(val); }}
              bestSteripathRate={bestSteripathRate}
              setBestSteripathRate={setBestSteripathRate}
              bestSteripathUtilization={bestSteripathUtilization}
              setBestSteripathUtilization={setBestSteripathUtilization}
              bestBlendedRate={bestBlendedRate}
              setBestBlendedRate={setBestBlendedRate}
              bestCalcBlendedRate={bestCalcBlendedRate}
              bestNonSteripathRate={bestNonSteripathRate}
              setBestNonSteripathRate={(val) => { setBestNonSteripathOverridden(true); setBestNonSteripathRate(val); }}
              showBestScenario={showBestScenario}
              setShowBestScenario={setIsCurrentCustomer}
              baselineRate={baselineRate}
              isMobile={mobileView}
            />
          </>
        );

        const outputContent = (
          <>
            <div ref={resultsRef} />
            <ExecutiveSummary
              calculations={calculations}
              period={period}
              isMobile={mobileView}
              compareA={compareA}
              setCompareA={setCompareA}
              compareB={compareB}
              setCompareB={setCompareB}
              showBestScenario={showBestScenario}
            />
            <ScenarioComparisonTable
              calculations={calculations}
              showBestScenario={showBestScenario}
              isMobile={mobileView}
              inputs={pdfInputs}
            />
            <MethodologySection
              isMethodologyOpen={isMethodologyOpen}
              setIsMethodologyOpen={setIsMethodologyOpen}
            />
          </>
        );

        return mobileView ? (
          <main className="py-10 flex justify-center bg-[#CBCFD3] min-h-screen">
            {/* iPhone 15 Pro shell */}
            <div className="relative flex-shrink-0" style={{ width: 393 }}>

              {/* Side buttons — left: mute + volume */}
              <div className="absolute rounded-l-[3px]" style={{ left: -4, top: 108, width: 4, height: 28, background: 'linear-gradient(to right, #6b7280, #9ca3af)' }} />
              <div className="absolute rounded-l-[3px]" style={{ left: -4, top: 154, width: 4, height: 60, background: 'linear-gradient(to right, #6b7280, #9ca3af)' }} />
              <div className="absolute rounded-l-[3px]" style={{ left: -4, top: 228, width: 4, height: 60, background: 'linear-gradient(to right, #6b7280, #9ca3af)' }} />

              {/* Side button — right: power */}
              <div className="absolute rounded-r-[3px]" style={{ right: -4, top: 178, width: 4, height: 80, background: 'linear-gradient(to left, #6b7280, #9ca3af)' }} />

              {/* Outer titanium frame */}
              <div
                className="w-full overflow-hidden"
                style={{
                  borderRadius: 54,
                  padding: 3,
                  background: 'linear-gradient(145deg, #8e8e93 0%, #636366 30%, #3a3a3c 60%, #8e8e93 100%)',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset',
                }}
              >
                {/* Screen glass */}
                <div className="relative overflow-hidden bg-[#F2F6F7]" style={{ borderRadius: 52 }}>

                  {/* Dynamic Island */}
                  <div
                    className="absolute z-20 bg-black"
                    style={{ top: 12, left: '50%', transform: 'translateX(-50%)', width: 126, height: 37, borderRadius: 20 }}
                  />

                  {/* Status bar */}
                  <div className="relative z-10 flex items-end justify-between px-8 pb-1" style={{ height: 59 }}>
                    <span className="text-[15px] font-semibold text-slate-900 tracking-tight">9:41</span>
                    <div className="flex items-center gap-1.5">
                      {/* Signal bars */}
                      <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" className="text-slate-900">
                        <rect x="0" y="6" width="3" height="6" rx="0.5"/>
                        <rect x="4.5" y="4" width="3" height="8" rx="0.5"/>
                        <rect x="9" y="2" width="3" height="10" rx="0.5"/>
                        <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.3"/>
                      </svg>
                      {/* WiFi */}
                      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" className="text-slate-900">
                        <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
                        <path d="M8 6C5.79 6 3.81 6.9 2.34 8.34L1 7a8.97 8.97 0 0114 0l-1.34 1.34C12.19 6.9 10.21 6 8 6z"/>
                        <path d="M8 3C4.69 3 1.73 4.35-.01 6.6L1.4 8a7.97 7.97 0 0113.2 0L16.01 6.6C14.27 4.35 11.31 3 8 3z" opacity="0.4"/>
                      </svg>
                      {/* Battery */}
                      <div className="flex items-center gap-0.5">
                        <div className="relative border-2 border-slate-900 rounded-[3px]" style={{ width: 24, height: 12 }}>
                          <div className="absolute inset-[1px] right-[3px] bg-slate-900 rounded-[1px]" style={{ right: 1 }} />
                        </div>
                        <div className="bg-slate-900 rounded-r-[2px]" style={{ width: 2, height: 5 }} />
                      </div>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="overflow-y-auto" style={{ maxHeight: 727 }}>
                    <div className="px-4 pb-4 space-y-5">
                      {inputContent}
                      {outputContent}
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex items-center justify-center bg-[#F2F6F7]" style={{ height: 34 }}>
                    <div className="bg-slate-900 rounded-full opacity-30" style={{ width: 134, height: 5 }} />
                  </div>
                </div>
              </div>
            </div>
          </main>
        ) : (
          <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
            {inputContent}
            {outputContent}
          </main>
        );
      })()}


      {!mobileView && (
        <button
          onClick={() => {
            if (scrolledPastInputs) {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              const top = resultsRef.current?.getBoundingClientRect().top ?? 0;
              window.scrollTo({ top: window.scrollY + top - 80, behavior: "smooth" });
            }
          }}
          className="fixed right-6 bottom-8 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-[#0842A6] text-white shadow-lg hover:bg-[#0B2D71] transition-colors"
          aria-label={scrolledPastInputs ? "Scroll to inputs" : "Scroll to results"}
        >
          {scrolledPastInputs ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
        </button>
      )}

      <div className="max-w-[1600px] mx-auto px-6 pb-2">
        <div className="flex items-center gap-3 justify-end">
          <span className="text-xs text-[#9AA1AA]">Save / load inputs:</span>
          <button
            onClick={handleExportInputs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#CBCFD3] bg-white text-[#636D78] hover:bg-[#F2F6F7] hover:text-[#151F26] transition-colors"
          >
            <Download size={13} />
            Export inputs
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#CBCFD3] bg-white text-[#636D78] hover:bg-[#F2F6F7] hover:text-[#151F26] transition-colors cursor-pointer">
            <Upload size={13} />
            Import inputs
            <input type="file" accept=".json" onChange={handleImportInputs} className="hidden" />
          </label>
        </div>
      </div>

      <Footer />

      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
