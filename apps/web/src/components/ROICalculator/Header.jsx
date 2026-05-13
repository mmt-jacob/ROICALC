import { Download, BarChart2, Mail } from "lucide-react";

export function Header({
  onGeneratePDF,
  isGeneratingPDF,
  onEmailPDF,
  isEmailingPDF,
  hospitalName,
}) {
  return (
    <header className="bg-white border-b border-[#CBCFD3] sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/mmt-logo.png"
            alt="MMT Logo"
            className="h-8 w-auto object-contain"
          />
          <h1 className="text-xl font-bold tracking-tight text-[#151F26]">
            Steripath® Impact Analysis
            {hospitalName && (
              <span className="font-normal text-[#636D78]"> — {hospitalName}</span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {hospitalName && (() => {
            const isIDN = hospitalName.endsWith(" (IDN / System)");
            const href = isIDN
              ? `https://10ay.online.tableau.com/#/site/magnoliamedicalmetrics/views/SalesUtilization/SalesUtilizations?:iid=3&IDN__c=${encodeURIComponent(hospitalName.slice(0, -15))}&select%20measurements=Eaches`
              : `https://10ay.online.tableau.com/#/site/magnoliamedicalmetrics/views/SalesUtilization/SalesUtilizations?Mmt%20Customer%20Name=${encodeURIComponent(hospitalName)}&select%20measurements=Eaches`;
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white border border-[#CBCFD3] hover:bg-[#F2F6F7] text-[#0842A6] px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:shadow transition-all duration-200"
              >
                <BarChart2 size={16} />
                Utilization Report
              </a>
            );
          })()}

          {onEmailPDF && (
            <button
              onClick={onEmailPDF}
              disabled={isEmailingPDF || isGeneratingPDF}
              title="Download the PDF and open a new email in Outlook"
              className="flex items-center gap-2 bg-white border border-[#CBCFD3] hover:bg-[#F2F6F7] text-[#0842A6] px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail size={16} />
              {isEmailingPDF ? "Preparing..." : "Email PDF"}
            </button>
          )}

          {onGeneratePDF && (
            <button
              onClick={onGeneratePDF}
              disabled={isGeneratingPDF || isEmailingPDF}
              className="flex items-center gap-2 bg-[#0842A6] hover:bg-[#0B2D71] text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              {isGeneratingPDF ? "Generating..." : "Export Executive Summary"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
