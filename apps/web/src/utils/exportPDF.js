let jsPDFLoaded = false;
let jsPDFPromise = null;

function loadJsPDF() {
  if (jsPDFLoaded && window.jspdf) return Promise.resolve(window.jspdf);
  if (jsPDFPromise) return jsPDFPromise;
  jsPDFPromise = new Promise((resolve, reject) => {
    const s1 = document.createElement("script");
    s1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s1.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
      s2.onload = () => { jsPDFLoaded = true; resolve(window.jspdf); };
      s2.onerror = () => reject(new Error("Failed to load jsPDF-AutoTable"));
      document.head.appendChild(s2);
    };
    s1.onerror = () => reject(new Error("Failed to load jsPDF"));
    document.head.appendChild(s1);
  });
  return jsPDFPromise;
}

export async function exportToPDF({
  inputs,
  calculations,
  showBestScenario = true,
  hospitalName = "",
  returnBlob = false,
}) {
  const jspdf = await loadJsPDF();
  const { jsPDF } = jspdf;
  const doc = new jsPDF({ orientation: "landscape" });

  // ── Color palette ──────────────────────────────────────────────────────────
  const blue      = [8, 66, 166];
  const darkBlue  = [11, 45, 113];
  const darkGray  = [21, 31, 38];
  const slateGray = [99, 109, 120];
  const lightGray = [154, 161, 170];
  const green     = [8, 178, 143];
  const red       = [240, 92, 71];

  const scenarioBg = {
    baseline: [242, 246, 247],
    current:  [232, 242, 255],
    best:     [230, 248, 244],
  };
  const scenarioText = {
    baseline: slateGray,
    current:  darkBlue,
    best:     [5, 107, 80],
  };

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 0;

  // ── Formatters ─────────────────────────────────────────────────────────────
  const fmtN   = (v) => Math.round(Number(v) || 0).toLocaleString("en-US");
  const fmtP   = (v, dp = 2) => (Number(v) || 0).toFixed(dp) + "%";
  const fmtVol = (v) => {
    const n = Number(v) || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return Math.round(n / 1_000) + "K";
    return fmtN(n);
  };
  const fmtCompact = (v) => {
    const n = Number(v) || 0;
    const abs = Math.abs(n);
    const sign = n < 0 ? "-$" : "$";
    if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(2) + "M";
    if (abs >= 1_000)     return sign + Math.round(abs / 1_000) + "K";
    return sign + Math.round(abs).toLocaleString();
  };
  const fmtMoney = (v) => {
    const n = Math.abs(Number(v) || 0);
    if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000)     return "$" + Math.round(n / 1_000) + "K";
    return "$" + Math.round(n).toLocaleString();
  };
  const fmtDollar = (v) => {
    const n = Number(v) || 0;
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const { baseline, current, best } = calculations;
  const rateMode = inputs.globalRateMode || "blended";
  const isBlended = rateMode === "blended";

  const contamAvoided      = Math.max(0, (baseline.contaminations || 0) - (current.contaminations || 0));
  const mortalityReduction = Math.round(contamAvoided * 0.034);
  const akiAvoided         = contamAvoided * 0.134;
  const antibioticDays     = contamAvoided * 1;

  const SCENARIO_DEFS = [
    { key: "baseline", label: "Pre-Steripath®\nBaseline" },
    { key: "current",  label: "Steripath®\nImplemented" },
    { key: "best",     label: "Increased\nCompliance" },
  ];
  const activeScenarios = SCENARIO_DEFS.filter(
    (s) => s.key !== "best" || showBestScenario,
  );

  // ── PAGE 1: HEADER ─────────────────────────────────────────────────────────
  const headerH = hospitalName ? 38 : 32;
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageW, headerH, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("Steripath® Impact Analysis", pageW / 2, 13, { align: "center" });

  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  if (hospitalName) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text(hospitalName, pageW / 2, 23, { align: "center" });
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text(`Generated: ${exportDate}`, pageW / 2, 31, { align: "center" });
    y = 44;
  } else {
    doc.setFontSize(8.5);
    doc.setFont(undefined, "normal");
    doc.text(`Generated: ${exportDate}`, pageW / 2, 24, { align: "center" });
    y = 38;
  }

  // ── EXECUTIVE SUMMARY ──────────────────────────────────────────────────────
  const currentRateDisplay = isBlended
    ? fmtP(current.blendedRate)
    : fmtP(inputs.currentSteripathRate);

  const util           = fmtP(inputs.steripathUtilization, 0);
  const period         = Number(inputs.period) || 12;
  const paybackRounded = Math.round(current.paybackMonths ?? 0);

  let execPara =
    `Over ${period} months, implementing Steripath® at ${util} utilization reduces the contamination ` +
    `rate from ${fmtP(inputs.baselineRate)} to ${currentRateDisplay}, avoiding an estimated ` +
    `${fmtN(Math.round(contamAvoided))} false-positive blood culture contaminations. This translates to ` +
    `${fmtMoney(current.netSavings)} in net cost avoidance`;

  if (current.paybackMonths != null && paybackRounded > 0) {
    execPara += `, with a ${paybackRounded}-month device payback period.`;
  } else {
    execPara += ".";
  }

  execPara +=
    ` Clinically, this could prevent approximately ${mortalityReduction} ${mortalityReduction === 1 ? "death" : "deaths"}, ` +
    `${fmtN(Math.round(akiAvoided))} AKI ${Math.round(akiAvoided) === 1 ? "event" : "events"}, ` +
    `and ${fmtN(Math.round(antibioticDays))} antibiotic treatment ${Math.round(antibioticDays) === 1 ? "day" : "days"} associated with contaminated cultures.`;

  if (showBestScenario) {
    const extraSavings = (best.netSavings || 0) - (current.netSavings || 0);
    const targetRateDisplay = isBlended
      ? fmtP(best.blendedRate)
      : fmtP(inputs.bestSteripathRate);
    if (extraSavings > 500) {
      execPara +=
        ` Increasing compliance to reach a ${targetRateDisplay} target rate could grow total savings to ` +
        `${fmtMoney(best.netSavings)} — an additional ${fmtMoney(extraSavings)} over the ${period}-month period.`;
    }
  }

  doc.setFillColor(239, 246, 255);
  const summaryLines = doc.splitTextToSize(execPara, pageW - margin * 2 - 16);
  const summaryH = summaryLines.length * 5.6 + 20;
  doc.roundedRect(margin - 2, y - 2, pageW - margin * 2 + 4, summaryH, 3, 3, "F");
  doc.setDrawColor(199, 219, 255);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin - 2, y - 2, pageW - margin * 2 + 4, summaryH, 3, 3, "S");

  doc.setTextColor(...blue);
  doc.setFontSize(7.5);
  doc.setFont(undefined, "bold");
  doc.text("EXECUTIVE SUMMARY", margin + 2, y + 6);
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text(summaryLines, margin + 2, y + 14);

  y += summaryH + 6;

  // ── KPI CARDS: CLINICAL RESULTS ────────────────────────────────────────────
  const paybackLabel = current.paybackMonths === null ? "N/A"
    : paybackRounded === 0 ? "< 1 mo."
    : `${paybackRounded} mo.`;

  const clinicalKpis = [
    { label: "Contaminations\nAvoided",          value: fmtN(Math.round(contamAvoided)) },
    { label: "Bed Days\nFreed",                  value: fmtN(Math.max(0, Math.round(current.bedDaysFreed))) },
    { label: "Potential Mortalities\nAvoided",   value: String(mortalityReduction) },
    { label: "AKI Events\nAvoided",              value: fmtN(Math.round(akiAvoided)) },
    { label: "Antibiotic Treatment\nDays Saved", value: fmtN(Math.round(antibioticDays)) },
  ];
  const financialKpis = [
    { label: "Net Cost\nAvoidance", value: fmtCompact(current.netSavings) },
    { label: "Payback\nPeriod",     value: paybackLabel },
  ];

  const cardGap  = 3;
  const cardH    = 27;
  const totalW   = pageW - margin * 2;

  // Clinical Results label
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...darkGray);
  doc.text("Clinical Results", pageW / 2, y + 5, { align: "center" });
  y += 9;

  const clinCardW = (totalW - cardGap * (clinicalKpis.length - 1)) / clinicalKpis.length;
  const drawKpiCard = (kpi, cx, cw) => {
    doc.setFillColor(...blue);
    doc.roundedRect(cx, y, cw, cardH, 3, 3, "F");
    doc.setTextColor(180, 210, 255);
    doc.setFontSize(6);
    doc.setFont(undefined, "normal");
    const labelLines = kpi.label.split("\n");
    labelLines.forEach((line, li) => {
      doc.text(line, cx + cw / 2, y + 6 + li * 4, { align: "center" });
    });
    doc.setTextColor(255, 255, 255);
    const valFontSize = kpi.value.length > 7 ? 12 : 14;
    doc.setFontSize(valFontSize);
    doc.setFont(undefined, "bold");
    doc.text(kpi.value, cx + cw / 2, y + cardH - 5, { align: "center" });
  };

  clinicalKpis.forEach((kpi, i) => drawKpiCard(kpi, margin + i * (clinCardW + cardGap), clinCardW));
  y += cardH + 7;

  // Financial Results label
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...darkGray);
  doc.text("Financial Results", pageW / 2, y + 5, { align: "center" });
  y += 9;

  const finCardW = (totalW - cardGap * (financialKpis.length - 1)) / financialKpis.length;
  financialKpis.forEach((kpi, i) => drawKpiCard(kpi, margin + i * (finCardW + cardGap), finCardW));
  y += cardH + 4;

  // Page 1 footer
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...lightGray);
  doc.text("©2026 Magnolia Medical Technologies, Inc. MKT-01039A", pageW - margin, pageH - 6, { align: "right" });

  // ── PAGE 2: INPUT TABLES + SCENARIO COMPARISON ────────────────────────────
  doc.addPage();

  doc.setFillColor(...darkBlue);
  doc.rect(0, 0, pageW, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont(undefined, "bold");
  doc.text("Steripath® Impact Analysis — Inputs & Scenario Comparison", margin, 8);
  if (hospitalName) {
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text(hospitalName, pageW - margin, 8, { align: "right" });
  }

  y = 18;

  // ── Section labels ─────────────────────────────────────────────────────────
  const genW      = 82;
  const colGap    = 5;
  const scenLeftX = margin + genW + colGap;

  doc.setFontSize(8.5);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...darkGray);
  doc.text("General Assumptions", margin, y);
  doc.text("Scenario Inputs", scenLeftX, y);
  y += 4;

  const tablesStartY = y;

  // ── Scenario Inputs rows ───────────────────────────────────────────────────
  const baselineRateStr = inputs.baselineHasAltProduct
    ? (isBlended
        ? fmtP(inputs.baselineAltBlendedRate) + " (blended)"
        : fmtP(inputs.baselineRate))
    : fmtP(inputs.baselineRate);

  const inputRowDefs = [
    {
      label: "Contamination Rate",
      vals: {
        baseline: baselineRateStr,
        current:  isBlended
          ? fmtP(inputs.currentBlendedRate) + " (blended)"
          : fmtP(inputs.currentSteripathRate) + " (device)",
        best:     isBlended
          ? fmtP(inputs.bestBlendedRate) + " (blended)"
          : fmtP(inputs.bestSteripathRate) + " (device)",
      },
    },
    {
      label: "Utilization Rate",
      vals: {
        baseline: inputs.baselineHasAltProduct ? fmtP(inputs.baselineAltUtilization, 0) : "—",
        current:  fmtP(inputs.steripathUtilization, 0),
        best:     fmtP(inputs.bestSteripathUtilization, 0),
      },
    },
    ...(!isBlended
      ? [
          {
            label: "Non-SP Rate",
            vals: {
              baseline: "—",
              current:
                Number(inputs.steripathUtilization) >= 100
                  ? "N/A"
                  : fmtP(inputs.currentNonSteripathRate),
              best:
                Number(inputs.bestSteripathUtilization) >= 100
                  ? "N/A"
                  : fmtP(inputs.bestNonSteripathRate),
            },
          },
        ]
      : []),
    {
      label: "Device Cost",
      vals: {
        baseline: inputs.baselineHasAltProduct
          ? `$${Number(inputs.baselineAltDeviceCost).toFixed(2)}`
          : "—",
        current: `$${Number(inputs.steripathDeviceCost).toFixed(2)}`,
        best:    `$${Number(inputs.steripathDeviceCost).toFixed(2)}`,
      },
    },
    {
      label: "Devices per Culture",
      vals: {
        baseline: inputs.baselineHasAltProduct
          ? String(inputs.baselineAltDevicesPerCulture)
          : "—",
        current: String(inputs.steripathDevicesPerCulture),
        best:    String(inputs.steripathDevicesPerCulture),
      },
    },
  ];

  const scenInpRows = inputRowDefs.map((row) => [
    row.label,
    ...activeScenarios.map((s) => String(row.vals[s.key] ?? "—")),
  ]);

  // ── General Assumptions rows: Time Period → Volume → Cost → LOS ────────────
  const genAssumpRows = [
    ["Time Period",                  (Number(inputs.period) || 12) + " months"],
    ["Blood Culture Volume",         fmtN(inputs.volume) + " cultures"],
    ["Cost per Contamination Event", fmtDollar(inputs.costPerCulture)],
    ["Extended Length of Stay",      (Number(inputs.losExtension) || 3.4) + " days"],
  ];

  // ── Equal-height calculation ────────────────────────────────────────────────
  const GEN_HEADER_H  = 8;
  const SCEN_HEADER_H = 10;
  const BASE_BODY_H   = 8;

  const genNaturalH  = GEN_HEADER_H  + genAssumpRows.length * BASE_BODY_H;
  const scenNaturalH = SCEN_HEADER_H + inputRowDefs.length * BASE_BODY_H;
  const targetH      = Math.max(genNaturalH, scenNaturalH);
  const genBodyMinH  = (targetH - GEN_HEADER_H)  / genAssumpRows.length;
  const scenBodyMinH = (targetH - SCEN_HEADER_H) / inputRowDefs.length;

  // ── General Assumptions table (left) ───────────────────────────────────────
  doc.autoTable({
    startY: tablesStartY,
    head: [["Parameter", "Value"]],
    body: genAssumpRows,
    theme: "grid",
    headStyles: {
      fillColor: blue,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 6.5,
      halign: "center",
      valign: "middle",
      minCellHeight: GEN_HEADER_H,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: darkGray,
      minCellHeight: genBodyMinH,
      valign: "middle",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 54, halign: "left",  fontStyle: "normal", cellPadding: { left: 3, top: 2, bottom: 2, right: 2 } },
      1: { cellWidth: 28, halign: "right", fontStyle: "bold",   cellPadding: { left: 2, top: 2, bottom: 2, right: 4 } },
    },
    margin: { left: margin, right: pageW - margin - genW },
  });
  const genFinalY = doc.lastAutoTable.finalY;

  // ── Scenario Inputs table (right) ──────────────────────────────────────────
  const scenTotalW = pageW - scenLeftX - margin;
  const scenLabelW = 44;
  const scenDataW  = (scenTotalW - scenLabelW) / activeScenarios.length;

  const scenColStyles = {
    0: { cellWidth: scenLabelW, fontStyle: "bold", halign: "left", valign: "middle",
         cellPadding: { left: 3, top: 2, bottom: 2, right: 2 } },
  };
  activeScenarios.forEach((_, i) => {
    scenColStyles[i + 1] = { cellWidth: scenDataW, halign: "center", valign: "middle" };
  });

  doc.autoTable({
    startY: tablesStartY,
    head: [["", ...activeScenarios.map((s) => s.label)]],
    body: scenInpRows,
    theme: "grid",
    headStyles: {
      fillColor: blue,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 6.5,
      halign: "center",
      valign: "middle",
      minCellHeight: SCEN_HEADER_H,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: darkGray,
      minCellHeight: scenBodyMinH,
      valign: "middle",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: scenColStyles,
    margin: { left: scenLeftX, right: margin },
    willDrawCell: (data) => {
      if (data.section === "head" && data.column.index > 0) {
        const s = activeScenarios[data.column.index - 1];
        if (s) {
          data.cell.styles.fillColor = scenarioBg[s.key];
          data.cell.styles.textColor = scenarioText[s.key];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });
  const scenFinalY = doc.lastAutoTable.finalY;

  y = Math.max(genFinalY, scenFinalY) + 8;

  // ── SCENARIO COMPARISON TABLE ──────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...darkGray);
  doc.text("Scenario Comparison", margin, y);
  doc.setFontSize(6.5);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...slateGray);
  doc.text(
    "Col 2 deltas vs. Baseline; Col 3 deltas vs. Steripath® Implemented. Green = improvement, red = worse.",
    margin, y + 5,
  );
  y += 11;

  const tableRowDefs = [
    {
      label:    "Avoided Contamination Events",
      sublabel: "False-positive cultures avoided vs. Pre-Steripath® Baseline",
      vals: {
        baseline: 0,
        current:  Math.max(0, (baseline.contaminations || 0) - (current.contaminations || 0)),
        best:     Math.max(0, (baseline.contaminations || 0) - (best.contaminations || 0)),
      },
      isCurrency: false, isRate: false, isAvoidance: true,
    },
    {
      label:    "Blended Contamination Rate",
      sublabel: "Sc. 1 effective baseline; Sc. 2-3 weighted by utilization mix",
      vals: { baseline: baseline.blendedRate, current: current.blendedRate, best: best.blendedRate },
      isCurrency: false, isRate: true, isAvoidance: false,
    },
    {
      label:    "Bed Days Freed",
      sublabel: "Sc. 2: total freed vs. Sc. 1 · Sc. 3: total freed vs. Sc. 1 (delta vs. Sc. 2 in subtext)",
      vals: {
        baseline: 0,
        current:  current.bedDaysFreed,
        best:     best.bedDaysFreed,
      },
      isCurrency: false, isRate: false, isAvoidance: true,
    },
    {
      label:    "Cost of Contaminations",
      sublabel: "Direct cost burden from false-positive cultures",
      vals: { baseline: baseline.contaminationCost, current: current.contaminationCost, best: best.contaminationCost },
      isCurrency: true, isRate: false, isAvoidance: false,
    },
    {
      label:    "Device Investment",
      sublabel: "Total device cost for the scenario",
      vals: {
        baseline: inputs.baselineHasAltProduct ? baseline.deviceCost : null,
        current:  current.deviceCost,
        best:     best.deviceCost,
      },
      isCurrency: true, isRate: false, isAvoidance: false,
    },
    {
      label:    "Total Hospital Cost",
      sublabel: "Contamination costs + device investment",
      vals: { baseline: baseline.totalCost, current: current.totalCost, best: best.totalCost },
      isCurrency: true, isRate: false, isAvoidance: false,
    },
    {
      label:    "Net Savings vs. Baseline",
      sublabel: "Cost avoided relative to Pre-Steripath® Baseline, after device investment",
      vals: { baseline: 0, current: current.netSavings, best: best.netSavings },
      isCurrency: true, isRate: false, isAvoidance: true,
    },
  ];

  const fmtCell = (val, key, def) => {
    if (val === null) return "—";
    if (key === "baseline" && def.isAvoidance) return "—";
    if (def.isRate)     return fmtP(val);
    if (def.isCurrency) return fmtCompact(val);
    return fmtN(Math.round(val));
  };

  const buildDeltaLabel = (cellVal, refVal, isCurrency, isRate, refLabel) => {
    if (cellVal === null || refVal === null) return null;
    const cell  = Number(cellVal) || 0;
    const ref   = Number(refVal)  || 0;
    const delta = cell - ref;
    const threshold = isRate ? 0.001 : 0.5;
    if (Math.abs(delta) < threshold) return null;
    const sign   = delta >= 0 ? "+" : "-";
    const abs    = Math.abs(delta);
    const fmtAbs = isRate
      ? abs.toFixed(2) + "%"
      : isCurrency
        ? fmtCompact(abs)
        : fmtN(Math.round(abs));
    const pctStr = !isRate && Math.abs(ref) > 0.5
      ? ` / ${sign}${Math.abs((delta / ref) * 100).toFixed(0)}%`
      : "";
    return `${sign}${fmtAbs}${pctStr} vs. ${refLabel}`;
  };

  const getDeltaGood = (cellVal, refVal, isAvoidance) => {
    const delta = (Number(cellVal) || 0) - (Number(refVal) || 0);
    return isAvoidance ? delta > 0 : delta < 0;
  };

  const shouldShowDelta = (key) => key !== "baseline";
  const getRef          = (key) => key === "current" ? "baseline" : key === "best" ? "current" : null;
  const getRefLabel     = (key) => key === "current" ? "Baseline" : key === "best" ? "Steripath® Impl." : "";

  const deltaCells = new Map();
  tableRowDefs.forEach((def, rIdx) => {
    activeScenarios.forEach((s, sOffset) => {
      if (!shouldShowDelta(s.key)) return;
      const refKey = getRef(s.key);
      if (!refKey) return;
      const dLabel = buildDeltaLabel(
        def.vals[s.key], def.vals[refKey], def.isCurrency, def.isRate, getRefLabel(s.key),
      );
      if (!dLabel) return;
      const isGood = getDeltaGood(def.vals[s.key], def.vals[refKey], def.isAvoidance);
      deltaCells.set(`${rIdx}-${sOffset + 1}`, { text: dLabel, isGood });
    });
  });

  const tBody = tableRowDefs.map((def) => [
    def.label,
    ...activeScenarios.map((s) => fmtCell(def.vals[s.key], s.key, def)),
  ]);

  const bodyCellH    = 11;
  const deltaFromBot = 2.5;
  const valuePadTop  = 2;
  const labelColW    = 56;
  const dataColW     = (pageW - margin * 2 - labelColW) / activeScenarios.length;

  // Store sublabels for didDrawCell
  const sublabels = tableRowDefs.map((d) => d.sublabel || "");

  const colStyles = {
    0: { cellWidth: labelColW, fontStyle: "bold", textColor: darkGray, halign: "left", valign: "top",
         cellPadding: { top: 3, bottom: 3, left: 3, right: 2 } },
  };
  activeScenarios.forEach((_, i) => {
    colStyles[i + 1] = {
      cellWidth: dataColW,
      halign: "center",
      valign: "top",
      cellPadding: { top: valuePadTop, bottom: deltaFromBot + 3, left: 1, right: 1 },
    };
  });

  doc.autoTable({
    startY: y,
    head: [["Metric", ...activeScenarios.map((s) => s.label)]],
    body: tBody,
    theme: "grid",
    headStyles: {
      fillColor: blue,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
      valign: "middle",
      minCellHeight: 10,
    },
    bodyStyles: {
      fontSize: 8,
      fontStyle: "bold",
      textColor: darkGray,
      minCellHeight: bodyCellH,
      halign: "center",
      valign: "top",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: colStyles,
    margin: { left: margin, right: margin },

    willDrawCell: (data) => {
      if (data.section === "head" && data.column.index > 0) {
        const s = activeScenarios[data.column.index - 1];
        if (s) {
          data.cell.styles.fillColor = scenarioBg[s.key] || [248, 250, 252];
          data.cell.styles.textColor = scenarioText[s.key] || darkGray;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },

    didDrawCell: (data) => {
      if (data.section === "body") {
        // Sublabel under row header (col 0)
        if (data.column.index === 0) {
          const sub = sublabels[data.row.index];
          if (sub) {
            doc.setFontSize(5);
            doc.setFont(undefined, "normal");
            doc.setTextColor(...slateGray);
            const subLines = doc.splitTextToSize(sub, data.cell.width - 5);
            doc.text(subLines, data.cell.x + 3, data.cell.y + data.cell.height - 3.5);
          }
        }
        // Delta label in data columns
        if (data.column.index > 0) {
          const key   = `${data.row.index}-${data.column.index}`;
          const delta = deltaCells.get(key);
          if (!delta) return;
          doc.setFontSize(5);
          doc.setFont(undefined, "normal");
          doc.setTextColor(...(delta.isGood ? green : red));
          doc.text(
            delta.text,
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height - deltaFromBot,
            { align: "center" },
          );
        }
      }
    },
  });

  // ── FOOTNOTE ───────────────────────────────────────────────────────────────
  const footnoteText =
    "This calculator provides illustrative cost avoidance and patient impact estimates based on user-entered information and assumptions derived from published literature, internal analyses, or other " +
    "external sources. The results are intended solely to assist healthcare professionals and decision-makers in evaluating potential economic and clinical considerations associated with the use of " +
    "the Steripath® Initial Specimen Diversion Device® platform (ISDD®). Patient impact figures are modeled estimates and do not constitute a guarantee of financial performance or clinical outcomes.\n" +
    "1. Klucher J, Davis K, Lakkad M, Painter JT, Dare RK. Risk factors and clinical outcomes associated with blood culture contamination. Infect Control Hosp Epidemiol. 2022;43(3):291-297. doi:10.1017/ice.2021.111. " +
    "2. Geisler BP, Jilg N, Patton RG, Pietzsch JB. Model to evaluate the impact of hospital-based interventions targeting false-positive blood cultures on economic and clinical outcomes. J Hosp Infect. 2019;102(4):438-444. doi:10.1016/j.jhin.2019.03.012. " +
    "3. Skoglund E, Dempsey CJ, Chen H, Garey KW. Estimated clinical and economic impact through use of a novel blood collection device to reduce blood culture contamination in the emergency department: a cost-benefit analysis. J Clin Microbiol. 2019;57(1):e01015-18. doi:10.1128/JCM.01015-18. " +
    "4. Alahmadi YM, Aldeyab MA, McElnay JC, et al. Clinical and economic impact of contaminated blood cultures within the hospital setting. J Hosp Infect. 2011;77(3):233-6. doi:10.1016/j.jhin.2010.09.033. " +
    "5. Gander RM, Byrd L, DeCrescenzo M, Hirany S, Bowen M, Baughman J. Impact of phlebotomy-drawn blood cultures on contamination rates and health care costs in a hospital emergency department. J Clin Microbiol. 2009;47(4):1021-4. doi:10.1128/JCM.02162-08. " +
    "6. Zwang O, Albert RK. Analysis of strategies to improve cost effectiveness of blood cultures. J Hosp Med. 2006;1(5):272-6. doi:10.1002/jhm.115. " +
    "7. Little JR, Murray PR, Traynor PS, Spitznagel E. A randomized trial of povidone-iodine compared with iodine tincture for venipuncture site disinfection: effects on rates of blood culture contamination. Am J Med. 1999;107(2):119-25. doi:10.1016/s0002-9343(99)00197-7. " +
    "8. Surdulescu S, Utamsingh D, and Shekar S. Phlebotomy teams reduce blood-culture contamination rate and save money. Clin Perform Qual Health Care. 1998;6(2):60-2. " +
    "9. Bates DW, Goldman L, Lee TH. Contaminant blood cultures and resource utilization. The true consequences of false-positive results. JAMA. 1991;265(3):365-9. doi:10.1001/jama.1991.03460030071031. " +
    "10. Dunagan WC, Woodward RS, Medoff G, et al. Antimicrobial misuse in patients with positive blood cultures. Am J Med. 1989;87(3):253-9. doi:10.1016/s0002-9343(89)80146-9. " +
    "*Adjusted by a 40% cost-to-charge ratio and then inflation adjusted using CPI Inflation Calculator from June year of publication to June 2019. Did not adjust 2022 study given recency.";

  const footnoteLines = doc.splitTextToSize(footnoteText, pageW - margin * 2);
  const footLineMm    = 5 * 0.42;
  const footnoteH     = footnoteLines.length * footLineMm + 2;
  const footnoteY     = pageH - footnoteH - 8;

  doc.setFontSize(5);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...lightGray);
  doc.text(footnoteLines, margin, footnoteY);

  // Page 2 footer
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...lightGray);
  doc.text("©2026 Magnolia Medical Technologies, Inc. MKT-01039A", pageW - margin, pageH - 6, { align: "right" });

  const fileName = `Steripath_Impact_Analysis_${new Date().toISOString().split("T")[0]}.pdf`;

  if (returnBlob) {
    return { blob: doc.output("blob"), fileName };
  }
  doc.save(fileName);
}
