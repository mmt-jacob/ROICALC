export function Footer() {
  return (
    <footer className="max-w-[1600px] mx-auto px-6 pt-2 pb-6 space-y-3">
      {/* Always-visible disclosure */}
      <div className="bg-[#F2F6F7] border border-[#CBCFD3] rounded-xl px-5 py-4">
        <p className="text-[11px] leading-relaxed text-[#636D78]">
          <strong className="text-[#151F26] font-semibold">Disclosure: </strong>
          This tool provides illustrative estimates of cost avoidance and patient impact based on
          user-entered information and assumptions derived from published literature, internal
          analyses, or other external sources. Results are intended solely to assist healthcare
          professionals and decision-makers in evaluating potential economic and clinical
          considerations associated with the use of the Steripath® Initial Specimen Diversion
          Device® platform (ISDD®). Patient impact figures — including excess mortality risk
          reduction, AKI events avoided, and antibiotic treatment days avoided — are modeled
          estimates based on published contamination outcomes data and should not be interpreted
          as guaranteed clinical results. The outputs of this tool do not constitute a guarantee
          of financial performance or clinical outcomes.
        </p>
      </div>

      {/* Copyright */}
      <div className="text-right">
        <p className="text-xs text-[#636D78]">
          ©2026 Magnolia Medical Technologies, Inc. MKT-01039A
        </p>
      </div>
    </footer>
  );
}
