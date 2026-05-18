import { useState, useMemo } from "react";
import { X, FileText, FileType, Mail, Send } from "lucide-react";

export const STUDIES = [
  {
    id: "dare-2023",
    label: "2023 Clinical Paper – University of Arkansas (Dare)",
    description: "Peer-reviewed clinical outcomes study",
    type: "pdf",
    file: "/studies/2023 Clinical Paper - University of Arkansas (Dare) .pdf",
  },
  {
    id: "cardamom",
    label: "Cardamom Study – Clinical Economic BCC Analysis",
    description: "Clinical economic blood culture contamination analysis",
    type: "pptx",
    file: "/studies/Cardamom Study - Clinical Economic BCC Analysis Results - MKT-01016 .pptx",
  },
];

function fmt$(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
function fmtN(n) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function buildDraft({ calculations, hospitalName, showBestScenario, period, inputs }) {
  const { baseline, current } = calculations;

  const contamAvoided = Math.max(0, (baseline.contaminations || 0) - (current.contaminations || 0));
  const costAvoidance = Math.max(0, (baseline.totalCost || 0) - (current.totalCost || 0));
  const bedDays = Math.max(0, current.bedDaysFreed || 0);
  const mortalityReduction = Math.round(contamAvoided * 0.034);

  const baselineDev = baseline.deviceCost || 0;
  const steripathDev = current.deviceCost || 0;
  const deviceInvestment = Math.max(0, steripathDev - baselineDev) || steripathDev;
  const grossSavings = Math.max(0, (baseline.contaminationCost || 0) - (current.contaminationCost || 0));
  const per = Number(period) || 12;
  const paybackMonths =
    deviceInvestment > 0 && grossSavings > 0
      ? Math.round((deviceInvestment / grossSavings) * per)
      : null;

  const facilityPhrase = hospitalName ? `for ${hospitalName}` : "for your facility";
  const utilPct = inputs?.steripathUtilization != null
    ? `${Number(inputs.steripathUtilization).toFixed(0)}%`
    : "current";
  const baselineRateFmt = `${(Number(inputs?.baselineRate) || 0).toFixed(2)}%`;
  const currentRateFmt  = `${(Number(calculations?.current?.blendedRate) || 0).toFixed(2)}%`;

  let draft = `Hi,\n\nThank you for your time today. I wanted to share the results of the Steripath® Impact Analysis ${facilityPhrase}.\n\n`;
  draft += `Based on inputs to the Steripath Impact Analysis, implementing Steripath® at ${utilPct} utilization may reduce contamination rates from ${baselineRateFmt} to ${currentRateFmt}, which may translate to the following estimated benefits:\n\n`;
  draft += `  • Contaminations avoided: ${fmtN(contamAvoided)} events\n`;
  draft += `  • Bed days freed: ${fmtN(bedDays)}\n`;
  draft += `  • Potential mortalities avoided: ${fmtN(mortalityReduction)} patients\n`;
  draft += `  • Net cost avoidance: ${fmt$(costAvoidance)}\n`;
  if (paybackMonths !== null) {
    draft += `  • Estimated payback period: ${paybackMonths} month${paybackMonths !== 1 ? "s" : ""}\n`;
  }

  draft += `\nI've attached the full Impact Analysis for your review. Happy to walk through the details and discuss next steps.\n\n`;
  draft += `Best regards,`;

  return draft;
}

function FileIcon({ type, size = 16 }) {
  if (type === "pptx") return <FileType size={size} className="text-[#C8511B] flex-shrink-0" />;
  return <FileText size={size} className="text-[#0842A6] flex-shrink-0" />;
}

export function StudySelectionModal({
  onConfirm,
  onClose,
  calculations,
  hospitalName,
  showBestScenario,
  period,
  inputs,
  isSending,
  signedInEmail,
}) {
  const [selected, setSelected] = useState(new Set());
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState(
    `Steripath® Impact Analysis${hospitalName ? ` — ${hospitalName}` : ""}`
  );

  const initialDraft = useMemo(
    () => buildDraft({ calculations, hospitalName, showBestScenario, period, inputs }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [emailBody, setEmailBody] = useState(initialDraft);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selected.size === STUDIES.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(STUDIES.map((s) => s.id)));
    }
  };

  const selectedStudies = STUDIES.filter((s) => selected.has(s.id));
  const canSend = recipientEmail.trim().length > 0 && !isSending;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#CBCFD3] w-full max-w-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#CBCFD3] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#151F26]">Email PDF</h2>
            <p className="text-sm text-[#636D78] mt-0.5">
              {signedInEmail
                ? `Sending as ${signedInEmail}`
                : "Sign in with Microsoft to send directly from your Outlook"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F2F6F7] text-[#9AA1AA] hover:text-[#151F26] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* To field */}
          <div>
            <label className="text-xs font-semibold text-[#636D78] uppercase tracking-wider mb-2 block">
              To <span className="normal-case font-normal text-[#9AA1AA]">— separate multiple with commas</span>
            </label>
            <input
              type="text"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@hospital.com, another@hospital.com"
              className="w-full text-sm text-[#151F26] bg-[#F2F6F7] border border-[#CBCFD3] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0061D5] focus:ring-2 focus:ring-[#0061D5]/10"
            />
          </div>

          {/* Subject field */}
          <div>
            <label className="text-xs font-semibold text-[#636D78] uppercase tracking-wider mb-2 block">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm text-[#151F26] bg-[#F2F6F7] border border-[#CBCFD3] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0061D5] focus:ring-2 focus:ring-[#0061D5]/10"
            />
          </div>

          {/* Draft email */}
          <div>
            <p className="text-xs font-semibold text-[#636D78] uppercase tracking-wider mb-2">
              Email Body
            </p>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={14}
              className="w-full text-sm text-[#151F26] bg-[#F2F6F7] border border-[#CBCFD3] rounded-xl px-4 py-3 resize-y focus:outline-none focus:border-[#0061D5] focus:ring-2 focus:ring-[#0061D5]/10 leading-relaxed font-mono"
              spellCheck
            />
          </div>

          {/* Studies */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#636D78] uppercase tracking-wider">
                Attach Supporting Studies
              </p>
              <button
                onClick={toggleAll}
                className="text-xs font-semibold text-[#0842A6] hover:text-[#0B2D71] transition-colors"
              >
                {selected.size === STUDIES.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="space-y-2">
              {STUDIES.map((study) => {
                const isChecked = selected.has(study.id);
                return (
                  <label
                    key={study.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? "border-[#0842A6] bg-[#EAF3FF]"
                        : "border-[#CBCFD3] bg-white hover:bg-[#F2F6F7]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(study.id)}
                      className="mt-0.5 accent-[#0842A6] w-4 h-4 flex-shrink-0 cursor-pointer"
                    />
                    <FileIcon type={study.type} size={16} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#151F26] leading-snug">{study.label}</p>
                      <p className="text-xs text-[#9AA1AA] mt-0.5">{study.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#CBCFD3] flex items-center gap-3 justify-end bg-[#F2F6F7] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#636D78] border border-[#CBCFD3] bg-white hover:bg-[#F2F6F7] transition-colors"
          >
            {isSending ? "Abort" : "Cancel"}
          </button>
          <button
            onClick={() => { console.log("Clicked send"); onConfirm(selectedStudies, emailBody, recipientEmail, subject); }}
            disabled={!canSend}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0842A6] hover:bg-[#0B2D71] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                <Send size={15} />
                {signedInEmail ? "Send via Outlook" : "Sign in & Send"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
