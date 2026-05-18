// Render a lucide-style SVG icon to a base64 PNG at the given pixel size.
// Returns null if rendering fails (icon will be skipped gracefully).
function renderIconToBase64(svgInner, size = 22) {
  return new Promise((resolve) => {
    try {
      const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgInner}</svg>`;
      const img = new Image();
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url  = URL.createObjectURL(blob);
      const timer = setTimeout(() => { URL.revokeObjectURL(url); resolve(null); }, 2000);
      img.onload = () => {
        clearTimeout(timer);
        const c = document.createElement("canvas");
        c.width = size; c.height = size;
        c.getContext("2d").drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = () => { clearTimeout(timer); URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } catch { resolve(null); }
  });
}

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
  compareA = "baseline",
  compareB = "current",
}) {
  const jspdf = await loadJsPDF();
  const { jsPDF } = jspdf;
  const doc = new jsPDF({ orientation: "landscape" });

  // ── Color palette ──────────────────────────────────────────────────────────
  const blue       = [8, 66, 166];
  const darkBlue   = [11, 45, 113];
  const darkGray   = [21, 31, 38];
  const slateGray  = [99, 109, 120];
  const lightGray  = [154, 161, 170];
  const green      = [8, 178, 143];
  const red        = [240, 92, 71];

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
  const fmtCompact = (v) => {
    const n = Number(v) || 0;
    const abs = Math.abs(n);
    const sign = n < 0 ? "-$" : "$";
    if (abs >= 1000) return sign + (abs / 1000000).toFixed(2) + "M";
    return sign + Math.round(abs).toLocaleString();
  };
  const fmtMoney = (v) => {
    const n = Math.abs(Number(v) || 0);
    if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000)     return "$" + (n / 1_000).toFixed(1) + "K";
    return "$" + Math.round(n).toLocaleString();
  };
  const fmtDollar = (v) => {
    const n = Number(v) || 0;
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const { baseline, current, best } = calculations;
  const rateMode  = inputs.globalRateMode || "blended";
  const isBlended = rateMode === "blended";

  const scenCalcA = calculations[compareA] || calculations.baseline;
  const scenCalcB = calculations[compareB] || calculations.current;
  const contamAvoided      = Math.max(0, (scenCalcA.contaminations || 0) - (scenCalcB.contaminations || 0));
  const mortalityReduction = Math.round(contamAvoided * 0.034);
  const akiAvoided         = contamAvoided * 0.134;
  const antibioticDays     = contamAvoided * 1;

  const SCENARIO_DEFS = {
    baseline: { key: "baseline", label: "Pre-Steripath®\nBaseline" },
    current:  { key: "current",  label: "Steripath®\nImplemented" },
    best:     { key: "best",     label: "Increased\nCompliance" },
  };
  const scenA = SCENARIO_DEFS[compareA] || SCENARIO_DEFS.baseline;
  const scenB = SCENARIO_DEFS[compareB] || SCENARIO_DEFS.current;
  // activeScenarios still used by input tables to know which scenario columns to show
  const activeScenarios = [scenA, scenB];

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
  const isBestB = compareB === "best";
  const util = isBestB
    ? fmtP(inputs.bestSteripathUtilization, 0)
    : fmtP(inputs.steripathUtilization, 0);
  const toRateDisplay = isBlended
    ? fmtP(scenCalcB.blendedRate)
    : isBestB ? fmtP(inputs.bestSteripathRate) : fmtP(inputs.currentSteripathRate);
  const fromRateDisplay = fmtP(scenCalcA.blendedRate);

  const period         = Number(inputs.period) || 12;
  const grossContamSavings = (scenCalcA.contaminationCost || 0) - (scenCalcB.contaminationCost || 0);
  const pdfPaybackMonths   = (scenCalcB.deviceCost || 0) > 0 && grossContamSavings > 0
    ? (scenCalcB.deviceCost / grossContamSavings) * period : null;
  const pdfPaybackRounded  = Math.round(pdfPaybackMonths ?? 0);
  const hidePayback        = compareA === "best" || compareB === "best";

  const execPara = isBestB
    ? `Based on the inputs provided, increasing Steripath® utilization to ${util} over a ${period}-month period may reduce the contamination rate from ${fromRateDisplay} to ${toRateDisplay}, which translates to the following estimated benefits:`
    : `Based on the inputs provided, implementing Steripath® at ${util} utilization over a ${period}-month period may reduce the contamination rate from ${fromRateDisplay} to ${toRateDisplay}, which translates to the following estimated benefits:`;

  // Title — left-aligned, bold, prominent
  doc.setTextColor(...blue);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("EXECUTIVE SUMMARY", margin, y + 7);

  // Sentence — left-aligned, normal weight, smaller
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  const summaryLines = doc.splitTextToSize(execPara, pageW - margin * 2);
  doc.text(summaryLines, margin, y + 15);

  y += 15 + summaryLines.length * 5.5 + 5;

  // ── KPI CARDS ─────────────────────────────────────────────────────────────
  // Pre-render lucide icons as PNG images so they match the website exactly
  const SVG = {
    syringe: `<path d="m19 11-8.14 8.14a2 2 0 0 1-2.83 0l-2.17-2.17a2 2 0 0 1 0-2.83L14 6"/><path d="M11 13 9 15"/><path d="M9 17 2 22"/><line x1="7" x2="9" y1="19" y2="17"/><line x1="14" x2="22" y1="2" y2="10"/><line x1="19" x2="21" y1="5" y2="3"/><line x1="13" x2="15" y1="7" y2="5"/>`,
    bed:     `<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 10H9.5a2.5 2.5 0 0 1 0-5H12"/><path d="M2 20h20"/>`,
    users:   `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    droplets:`<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>`,
    pill:    `<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>`,
    dollar:  `<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`,
    clock:   `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  };

  const ICON_PX = 192;
  const [iSyringe, iBed, iUsers, iDroplets, iPill, iDollar, iClock] = await Promise.all(
    ["syringe","bed","users","droplets","pill","dollar","clock"].map(k => renderIconToBase64(SVG[k], ICON_PX))
  );

  const paybackLabel = hidePayback || pdfPaybackMonths === null ? "N/A"
    : pdfPaybackRounded === 0 ? "< 1 mo."
    : `${pdfPaybackRounded} mo.`;

  const netCostAvoidance = Math.max(0, (scenCalcA.totalCost || 0) - (scenCalcB.totalCost || 0));
  const pdfBedDaysFreed  = Math.max(0, Math.round((scenCalcB.bedDaysFreed || 0) - (scenCalcA.bedDaysFreed || 0)));

  const clinicalKpis = [
    { label: "Contaminations Avoided",           value: fmtN(Math.round(contamAvoided)),          icon: iSyringe },
    { label: "Potential Mortalities Avoided",    value: `${fmtN(mortalityReduction)} People`,      icon: iUsers,    sublabel: "contaminations avoided × 3.4%" },
    { label: "AKI Events Avoided",               value: fmtN(Math.round(akiAvoided)),              icon: iDroplets, sublabel: "contaminations avoided × 13.4%" },
    { label: "Antibiotic Treatment Days Avoided",value: fmtN(Math.round(antibioticDays)),          icon: iPill,     sublabel: "contaminations avoided × 1 day" },
  ];
  const financialKpis = [
    { label: "Net Cost Avoidance", value: fmtMoney(netCostAvoidance), icon: iDollar },
    ...(!hidePayback ? [{ label: "Payback Period", value: paybackLabel, icon: iClock }] : []),
    { label: "Bed Days Freed",     value: fmtN(pdfBedDaysFreed),      icon: iBed  },
  ];

  const cardGap  = 3;
  const cardH    = 52;
  const totalW   = pageW - margin * 2;
  const iconSzMM = 8;     // icon box size in mm
  const iconTopMM = 3;    // from card top to icon top
  // Fixed value Y offset (from rowY) — same for ALL cards so values align on y-axis
  const fixedValueOffsetMM = cardH * 0.68;
  const fixedSubOffsetMM   = fixedValueOffsetMM + 7;
  // Label block centered halfway between icon bottom and value Y
  const iconBottomMM   = iconTopMM + iconSzMM;
  const labelCenterMM  = (iconBottomMM + fixedValueOffsetMM) / 2;
  const labelLineH     = 4.5;

  const drawKpiCard = (kpi, cx, cw, rowY) => {
    // Card background
    doc.setFillColor(...blue);
    doc.roundedRect(cx, rowY, cw, cardH, 3, 3, "F");

    // Icon box: slightly lighter blue rounded square, centered at top
    const iconX = cx + (cw - iconSzMM) / 2;
    const iconY = rowY + iconTopMM;
    doc.setFillColor(30, 100, 210);
    doc.roundedRect(iconX, iconY, iconSzMM, iconSzMM, 2, 2, "F");

    // Icon image (actual lucide icon rendered as PNG)
    if (kpi.icon) {
      doc.addImage(kpi.icon, "PNG", iconX + 1, iconY + 1, iconSzMM - 2, iconSzMM - 2);
    }

    // Label — white, block centered halfway between icon bottom and value
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    const labelLines = doc.splitTextToSize(kpi.label, cw - 4);
    const labelBlockH = (labelLines.length - 1) * labelLineH;
    const labelStartY = rowY + labelCenterMM - labelBlockH / 2;
    labelLines.forEach((line, li) => {
      doc.text(line, cx + cw / 2, labelStartY + li * labelLineH, { align: "center" });
    });

    // Value — fixed Y for all cards (ensures y-axis alignment)
    const valueY = rowY + fixedValueOffsetMM;
    const valFontSize = kpi.value.length > 10 ? 14 : kpi.value.length > 7 ? 17 : 20;
    doc.setFontSize(valFontSize);
    doc.setFont(undefined, "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(kpi.value, cx + cw / 2, valueY, { align: "center" });

    // Sublabel — below value (only for 3 clinical cards)
    if (kpi.sublabel) {
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.setTextColor(200, 220, 255);
      doc.text(kpi.sublabel, cx + cw / 2, rowY + fixedSubOffsetMM, { align: "center" });
    }
  };

  // Clinical Results row
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...darkGray);
  doc.text("Clinical Results", pageW / 2, y + 5, { align: "center" });
  y += 9;

  const clinCardW = (totalW - cardGap * (clinicalKpis.length - 1)) / clinicalKpis.length;
  clinicalKpis.forEach((kpi, i) => drawKpiCard(kpi, margin + i * (clinCardW + cardGap), clinCardW, y));
  y += cardH + 7;

  // Financial Results row
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...darkGray);
  doc.text("Financial & Operational Results", pageW / 2, y + 5, { align: "center" });
  y += 9;

  const finTotalW = clinCardW * financialKpis.length + cardGap * (financialKpis.length - 1);
  const finStartX = margin + (totalW - finTotalW) / 2;
  financialKpis.forEach((kpi, i) => drawKpiCard(kpi, finStartX + i * (clinCardW + cardGap), clinCardW, y));
  y += cardH + 4;

  // Page 1 footer
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...lightGray);
  doc.text("©2026 Magnolia Medical Technologies, Inc. MKT-01039A", pageW - margin, pageH - 6, { align: "right" });

  // ── PAGE 2: SCENARIO COMPARISON, THEN INPUT TABLES ────────────────────────
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

  y = 20;

  // ── SCENARIO COMPARISON TABLE ──────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...darkGray);
  doc.text("Scenario Comparison", margin, y);
  y += 6;

  const tableRowDefs = [
    {
      label:    "Avoided Contamination Events",
      sublabel: "False-positive cultures avoided vs. Pre-Steripath® Baseline",
      vals: {
        baseline: 0,
        current:  Math.max(0, (baseline.contaminations || 0) - (current.contaminations || 0)),
        best:     Math.max(0, (baseline.contaminations || 0) - (best.contaminations || 0)),
      },
      isCurrency: false, isRate: false, isAvoidance: true, positiveIsGood: true,
    },
    {
      label:    "Blended Contamination Rate",
      sublabel: "Contamination rate weighted by Utilization Rate",
      vals: { baseline: baseline.blendedRate, current: current.blendedRate, best: best.blendedRate },
      isCurrency: false, isRate: true, isAvoidance: false, positiveIsGood: false,
    },
    {
      label:    "Cost of Contaminations",
      sublabel: "Direct cost burden from false-positive cultures",
      vals: { baseline: baseline.contaminationCost, current: current.contaminationCost, best: best.contaminationCost },
      isCurrency: true, isRate: false, isAvoidance: false, positiveIsGood: false,
    },
    {
      label:    "Device Investment",
      sublabel: "Total device cost",
      vals: {
        baseline: inputs.baselineHasAltProduct ? baseline.deviceCost : 0,
        current:  current.deviceCost,
        best:     best.deviceCost,
      },
      isCurrency: true, isRate: false, isAvoidance: false,
      hideBaseline: !inputs.baselineHasAltProduct, noColor: true,
    },
    {
      label:    "Total Hospital Cost",
      sublabel: "Contamination costs + device investment",
      vals: { baseline: baseline.totalCost, current: current.totalCost, best: best.totalCost },
      isCurrency: true, isRate: false, isAvoidance: false, positiveIsGood: false,
    },
    {
      label:    "Net Savings",
      sublabel: "Cost avoided relative to Pre-Steripath® Baseline, after device investment",
      vals: { baseline: 0, current: current.netSavings, best: best.netSavings },
      isCurrency: true, isRate: false, isAvoidance: true, positiveIsGood: true,
    },
  ];

  const fmtCell = (val, key, def) => {
    if (val === null) return "—";
    if (def.hideBaseline && key === "baseline") return "—";
    if (key === "baseline" && def.isAvoidance) return "—";
    if (def.isRate)     return fmtP(val);
    if (def.isCurrency) return fmtCompact(val);
    return fmtN(Math.round(val));
  };

  const fmtDeltaCell = (def) => {
    const aIsHidden = (def.hideBaseline && compareA === "baseline") || (def.isAvoidance && compareA === "baseline");
    const numA = aIsHidden ? 0 : (Number(def.vals[compareA]) || 0);
    const numB = Number(def.vals[compareB]) || 0;
    const delta = numB - numA;
    const threshold = def.isRate ? 0.001 : 0.5;
    if (Math.abs(delta) < threshold) return "—";
    const sign = delta >= 0 ? "+" : "–";
    const abs = Math.abs(delta);
    if (def.isRate)     return `${sign}${abs.toFixed(2)}%`;
    if (def.isCurrency) return `${sign}${fmtCompact(abs)}`;
    return `${sign}${fmtN(Math.round(abs))}`;
  };

  const getDeltaColor = (def) => {
    if (def.noColor) return null;
    const aIsHidden = (def.hideBaseline && compareA === "baseline") || (def.isAvoidance && compareA === "baseline");
    const numA = aIsHidden ? 0 : (Number(def.vals[compareA]) || 0);
    const numB = Number(def.vals[compareB]) || 0;
    const delta = numB - numA;
    const threshold = def.isRate ? 0.001 : 0.5;
    if (Math.abs(delta) < threshold) return null;
    const isGood = def.positiveIsGood ? delta > 0 : delta < 0;
    return isGood ? [22, 163, 74] : [220, 38, 38];
  };

  const mutedGray = [154, 161, 170];

  const tBody = tableRowDefs.map((def) => {
    const deltaStr = fmtDeltaCell(def);
    const deltaColor = getDeltaColor(def);
    return [
      def.label,
      fmtCell(def.vals[compareA], compareA, def),
      fmtCell(def.vals[compareB], compareB, def),
      { content: deltaStr, styles: { textColor: deltaColor ?? mutedGray } },
    ];
  });

  const bodyCellH = 13;
  const labelColW = 56;
  const dataColW  = (pageW - margin * 2 - labelColW) / 3;
  const sublabels = tableRowDefs.map((d) => d.sublabel || "");

  const outColStyles = {
    0: { cellWidth: labelColW, fontStyle: "bold", fontSize: 9, textColor: darkGray, halign: "left", valign: "top",
         cellPadding: { top: 3, bottom: 3, left: 3, right: 2 } },
    1: { cellWidth: dataColW, halign: "center", valign: "top", cellPadding: { top: 2, bottom: 3, left: 1, right: 1 } },
    2: { cellWidth: dataColW, halign: "center", valign: "top", cellPadding: { top: 2, bottom: 3, left: 1, right: 1 } },
    3: { cellWidth: dataColW, halign: "center", valign: "top", cellPadding: { top: 2, bottom: 3, left: 1, right: 1 },
         textColor: darkGray },
  };

  doc.autoTable({
    startY: y,
    head: [["Metric", scenA.label, scenB.label, "Change"]],
    body: tBody,
    theme: "grid",
    headStyles: {
      fillColor: blue,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      minCellHeight: 10,
    },
    bodyStyles: {
      fontSize: 10,
      fontStyle: "bold",
      textColor: darkGray,
      minCellHeight: bodyCellH,
      halign: "center",
      valign: "top",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: outColStyles,
    margin: { left: margin, right: margin },

    willDrawCell: (data) => {
      if (data.section === "head") {
        if (data.column.index === 1) {
          data.cell.styles.fillColor = scenarioBg[scenA.key] || [248, 250, 252];
          data.cell.styles.textColor = scenarioText[scenA.key] || darkGray;
        } else if (data.column.index === 2) {
          data.cell.styles.fillColor = scenarioBg[scenB.key] || [248, 250, 252];
          data.cell.styles.textColor = scenarioText[scenB.key] || darkGray;
        } else if (data.column.index === 3) {
          data.cell.styles.fillColor = [248, 250, 252];
          data.cell.styles.textColor = darkGray;
        }
      }
    },

    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const sub = sublabels[data.row.index];
        if (sub) {
          doc.setFontSize(7.5);
          doc.setFont(undefined, "normal");
          doc.setTextColor(...slateGray);
          const subLines = doc.splitTextToSize(sub, data.cell.width - 5);
          doc.text(subLines, data.cell.x + 3, data.cell.y + data.cell.height - 4.0);
        }
      }
    },
  });

  const _scenFinalY = doc.lastAutoTable.finalY;

  // Footnote strings defined here so we can compute height for vertical centering below
  const footnoteDisclaimer =
    "This calculator provides illustrative cost avoidance and patient impact estimates based on user-entered information and assumptions derived from published literature, internal analyses, or " +
    "other external sources. The results are intended solely to assist healthcare professionals and decision-makers in evaluating potential economic and clinical considerations associated with the " +
    "use of the Steripath® Initial Specimen Diversion Device® platform (ISDD®). Patient impact figures are modeled estimates and do not constitute a guarantee of financial performance or clinical outcomes.";
  const footnoteRefs =
    "1. Klucher J, Davis K, Lakkad M, Painter JT, Dare RK. Infect Control Hosp Epidemiol. 2022;43(3):291-297. " +
    "2. Geisler BP, et al. J Hosp Infect. 2019;102(4):438-444. " +
    "3. Skoglund E, et al. J Clin Microbiol. 2019;57(1):e01015-18. " +
    "4. Alahmadi YM, et al. J Hosp Infect. 2011;77(3):233-6. " +
    "5. Gander RM, et al. J Clin Microbiol. 2009;47(4):1021-4. " +
    "6. Zwang O, Albert RK. J Hosp Med. 2006;1(5):272-6. " +
    "7. Little JR, et al. Am J Med. 1999;107(2):119-25. " +
    "8. Surdulescu S, et al. Clin Perform Qual Health Care. 1998;6(2):60-2. " +
    "9. Bates DW, et al. JAMA. 1991;265(3):365-9. " +
    "10. Dunagan WC, et al. Am J Med. 1989;87(3):253-9. " +
    "*Adjusted by 40% cost-to-charge ratio and CPI inflation to June 2019.";

  // Pre-compute footnote height so we can vertically center the input tables
  const _fnFullW = pageW - margin * 2;
  doc.setFontSize(7);
  const _fnH = (doc.splitTextToSize(footnoteDisclaimer, _fnFullW).length + 1 +
                doc.splitTextToSize(footnoteRefs, _fnFullW).length) * 2.5 + 2;
  const _fnAnchorY = pageH - _fnH - 8;
  // Estimate input block height: 4mm for title row + max of gen/scen table heights
  const _inputRows  = isBlended ? 4 : 6;
  const _estBlockH  = 4 + Math.max(8 + 4 * 6, 10 + _inputRows * 6);
  y = _scenFinalY + Math.max(5, (_fnAnchorY - _scenFinalY - _estBlockH) / 2);

  // ── SIDE-BY-SIDE: General Assumptions (left) + Scenario Inputs (right) ─────
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

  // ── General Assumptions rows ───────────────────────────────────────────────
  const genAssumpRows = [
    ["Time Period",                  (Number(inputs.period) || 12) + " months"],
    ["Blood Culture Volume",         fmtN(inputs.volume) + " cultures"],
    ["Cost per Contamination Event", fmtDollar(inputs.costPerCulture)],
    ["Extended Length of Stay",      (Number(inputs.losExtension) || 3.4) + " days"],
  ];

  // ── Scenario Inputs rows — different structure for blended vs device-specific
  let inputRowDefs;

  if (isBlended) {
    inputRowDefs = [
      {
        label: "Contamination Rate",
        vals: {
          baseline: inputs.baselineHasAltProduct
            ? fmtP(inputs.baselineAltBlendedRate) + " (blended)"
            : fmtP(inputs.baselineRate),
          current:  fmtP(inputs.currentBlendedRate) + " (blended)",
          best:     fmtP(inputs.bestBlendedRate) + " (blended)",
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
      {
        label: "Device Cost",
        vals: {
          baseline: inputs.baselineHasAltProduct ? `$${Number(inputs.baselineAltDeviceCost).toFixed(2)}` : "—",
          current:  `$${Number(inputs.steripathDeviceCost).toFixed(2)}`,
          best:     `$${Number(inputs.steripathDeviceCost).toFixed(2)}`,
        },
      },
      {
        label: "Devices per Culture",
        vals: {
          baseline: inputs.baselineHasAltProduct ? String(inputs.baselineAltDevicesPerCulture) : "—",
          current:  String(inputs.steripathDevicesPerCulture),
          best:     String(inputs.steripathDevicesPerCulture),
        },
      },
    ];
  } else {
    // Device-specific mode: Device Rate → Non-Device Rate → Blended Rate → Utilization → Device Cost → Devices/Culture
    const baselineUtil100 = Number(inputs.baselineAltUtilization) >= 100;
    const currentUtil100  = Number(inputs.steripathUtilization)   >= 100;
    const bestUtil100     = Number(inputs.bestSteripathUtilization) >= 100;

    inputRowDefs = [
      {
        label: "Device-Specific Contamination Rate",
        vals: {
          baseline: inputs.baselineHasAltProduct ? fmtP(inputs.baselineAltRate) : "—",
          current:  fmtP(inputs.currentSteripathRate),
          best:     fmtP(inputs.bestSteripathRate),
        },
      },
      {
        label: "Non-Device Contamination Rate",
        vals: {
          baseline: inputs.baselineHasAltProduct
            ? fmtP(inputs.baselineAltNonSteripathRate)
            : fmtP(inputs.baselineRate),
          current:  currentUtil100 ? "N/A" : fmtP(inputs.currentNonSteripathRate),
          best:     bestUtil100    ? "N/A" : fmtP(inputs.bestNonSteripathRate),
        },
      },
      {
        label: "Blended Contamination Rate",
        vals: {
          baseline: fmtP(baseline.blendedRate),
          current:  fmtP(current.blendedRate),
          best:     fmtP(best.blendedRate),
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
      {
        label: "Device Cost",
        vals: {
          baseline: inputs.baselineHasAltProduct ? `$${Number(inputs.baselineAltDeviceCost).toFixed(2)}` : "—",
          current:  `$${Number(inputs.steripathDeviceCost).toFixed(2)}`,
          best:     `$${Number(inputs.steripathDeviceCost).toFixed(2)}`,
        },
      },
      {
        label: "Devices per Culture",
        vals: {
          baseline: inputs.baselineHasAltProduct ? String(inputs.baselineAltDevicesPerCulture) : "—",
          current:  String(inputs.steripathDevicesPerCulture),
          best:     String(inputs.steripathDevicesPerCulture),
        },
      },
    ];
  }

  const scenInpRows = inputRowDefs.map((row) => [
    row.label,
    ...activeScenarios.map((s) => String(row.vals[s.key] ?? "—")),
  ]);

  // ── Equal-height calc ──────────────────────────────────────────────────────
  const GEN_HEADER_H  = 8;
  const SCEN_HEADER_H = 10;
  const BASE_BODY_H   = 6;

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
      fontSize: 9,
      halign: "center",
      valign: "middle",
      minCellHeight: GEN_HEADER_H,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: darkGray,
      minCellHeight: genBodyMinH,
      valign: "middle",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 54, halign: "left",  fontStyle: "bold",   cellPadding: { left: 3, top: 2, bottom: 2, right: 2 } },
      1: { cellWidth: 28, halign: "right", fontStyle: "normal", cellPadding: { left: 2, top: 2, bottom: 2, right: 4 } },
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
      fontSize: 9,
      halign: "center",
      valign: "middle",
      minCellHeight: SCEN_HEADER_H,
    },
    bodyStyles: {
      fontSize: 7,
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

  y = Math.max(genFinalY, scenFinalY) + 4;

  // ── FOOTNOTE — full width, positioned after tables, consistent font ─────────
  const fullWidth = pageW - margin * 2;

  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...lightGray);

  const disclaimerLines = doc.splitTextToSize(footnoteDisclaimer, fullWidth);
  const refLines        = doc.splitTextToSize(footnoteRefs, fullWidth);
  const lineH = 2.5;
  const footnoteH = (disclaimerLines.length + 1 + refLines.length) * lineH + 2;

  // If footnote would overlap the tables, push it just below; otherwise anchor near bottom
  const minFootY  = y + 2;
  const anchorY   = pageH - footnoteH - 8;
  const footnoteY = Math.max(minFootY, anchorY);

  doc.text(disclaimerLines, margin, footnoteY);
  doc.text(refLines, margin, footnoteY + disclaimerLines.length * lineH + lineH);

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
