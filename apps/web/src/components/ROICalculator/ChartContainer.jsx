export function ChartContainer({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#CBCFD3] p-6 shadow-sm flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-base font-bold text-[#636D78] uppercase tracking-wider">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-[#9AA1AA] mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1 flex items-center justify-center">{children}</div>
    </div>
  );
}
