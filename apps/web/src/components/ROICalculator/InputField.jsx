import { twMerge } from "tailwind-merge";
import { useState } from "react";

export function InputField({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  prefix,
  suffix,
  step,
  min,
  maxDecimals,
  fixedDecimals,
  placeholder,
  gray = false,
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (
      type === "number" &&
      (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E")
    ) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    if (type === "number") {
      let val = e.target.value;
      val = val.replace(/,/g, "");
      if (val === "") { onChange({ target: { value: "" } }); return; }
      if (val === ".") { onChange({ target: { value: "0." } }); return; }
      if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
        val = val.replace(/^0+/, "");
      }
      const numVal = parseFloat(val);
      if (!isNaN(numVal) && numVal < 0) return;
      const numberPattern = maxDecimals != null
        ? new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`)
        : /^\d*\.?\d*$/;
      if (numberPattern.test(val)) {
        onChange({ target: { value: val } });
      }
    } else {
      onChange(e);
    }
  };

  const displayValue = (() => {
    if (type !== "number" || !value || isFocused) return value;
    if (fixedDecimals != null) return Number(value).toFixed(fixedDecimals);
    if (!String(value).includes(".")) return Number(value).toLocaleString();
    return value;
  })();

  // Shared border classes
  const borderCls = gray
    ? "border-[#CBCFD3] focus-within:border-[#9AA1AA] focus-within:ring-4 focus-within:ring-[#9AA1AA]/10"
    : "border-[#99CCFF] focus-within:border-[#0061D5] focus-within:ring-4 focus-within:ring-[#0061D5]/10";

  const inputCls = twMerge(
    "w-full h-12 bg-white border-2 rounded-xl px-4 outline-none transition-all font-semibold text-[#151F26]",
    gray
      ? "border-[#CBCFD3] focus:border-[#9AA1AA] focus:ring-4 focus:ring-[#9AA1AA]/10"
      : "border-[#99CCFF] focus:border-[#0061D5] focus:ring-4 focus:ring-[#0061D5]/10",
    prefix && "pl-8",
  );

  // Inline-% layout: shrink input to content width, % sits right after the number
  const isPercentSuffix = suffix === "%";

  return (
    <div className="space-y-2">
      <label className={`text-sm font-semibold flex items-center gap-1.5 ${gray ? "text-[#636D78]" : "text-[#0842A6]"}`}>
        {label}
      </label>

      {isPercentSuffix ? (
        /* ── Inline-% container ───────────────────────────────────────── */
        <div className={twMerge(
          "flex items-center h-12 bg-white border-2 rounded-xl px-4 transition-all",
          borderCls,
          prefix && "pl-8",
        )}>
          {prefix && (
            <span className="mr-1 font-semibold text-[#151F26]">{prefix}</span>
          )}
          <input
            type={type === "number" ? "text" : type}
            inputMode={type === "number" ? "decimal" : undefined}
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { setIsFocused(false); onBlur?.(); }}
            step={step}
            min={min}
            placeholder={placeholder}
            className="min-w-0 bg-transparent outline-none font-semibold text-[#151F26]"
            style={{ width: `${Math.max(2, String(displayValue ?? "").length + 0.5)}ch` }}
          />
          <span className="font-semibold text-[#151F26] flex-shrink-0">%</span>
        </div>
      ) : (
        /* ── Standard layout ($ prefix or no symbol) ──────────────────── */
        <div className="relative group">
          {prefix && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-[#151F26]">
              {prefix}
            </span>
          )}
          <input
            type={type === "number" ? "text" : type}
            inputMode={type === "number" ? "decimal" : undefined}
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { setIsFocused(false); onBlur?.(); }}
            step={step}
            min={min}
            placeholder={placeholder}
            className={twMerge(inputCls, suffix && !isPercentSuffix && "pr-20")}
          />
          {suffix && !isPercentSuffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-[#151F26] text-xs uppercase tracking-wider">
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
