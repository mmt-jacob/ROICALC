import { twMerge } from "tailwind-merge";

export function CalculatedField({ label, value, suffix }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#636D78] flex items-center gap-1.5">
        {label}
      </label>
      <div className="relative">
        <div
          className={twMerge(
            "w-full h-12 bg-[#F2F6F7] border-2 border-[#CBCFD3] rounded-xl px-4 flex items-center font-bold text-[#636D78]",
            suffix && "pr-20",
          )}
        >
          {value}
        </div>
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA1AA] text-xs font-bold uppercase tracking-wider">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
