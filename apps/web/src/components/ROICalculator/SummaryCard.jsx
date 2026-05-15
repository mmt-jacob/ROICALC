import { useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";

const EDGE_THRESHOLD = 55;

export function SummaryCard({ label, sublabel, value, icon, color, compact, fullWidth, href, tooltip }) {
  const wrapRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false });

  const handleMouseMove = useCallback((e) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const { left, top, width, height } = wrap.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const distToEdge = Math.min(x, width - x, y, height - y);
    const opacity = distToEdge >= EDGE_THRESHOLD
      ? 0
      : parseFloat((1 - distToEdge / EDGE_THRESHOLD).toFixed(3));
    wrap.style.setProperty("--mouse-x", `${x}px`);
    wrap.style.setProperty("--mouse-y", `${y}px`);
    wrap.style.setProperty("--glow-opacity", opacity);
    if (tooltip) setTooltipPos({ x: e.clientX, y: e.clientY, visible: true });
  }, [tooltip]);

  const handleMouseLeave = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.style.setProperty("--glow-opacity", 0);
    if (tooltip) setTooltipPos((p) => ({ ...p, visible: false }));
  }, [tooltip]);

  const Tag = href ? "a" : "div";
  const linkProps = href ? { href, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <>
      {/* Wrapper owns the grid span and the border sheen (::before at inset -1.5px) */}
      <div
        ref={wrapRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={twMerge(
          "fluent-card-wrap",
          compact ? "col-span-1" : "",
          fullWidth && "col-span-2",
        )}
      >
        <Tag
          {...linkProps}
          className={twMerge(
            "reveal-card rounded-2xl shadow-lg flex flex-col items-center text-center select-none w-full h-full",
            compact ? "p-4" : "p-6",
            href && "cursor-pointer",
            color,
          )}
        >
          {/* Icon */}
          <div className={twMerge("flex-shrink-0", compact ? "mb-2" : "mb-3")}>
            <div className={twMerge("rounded-xl bg-white/20 inline-block", compact ? "p-2" : "p-3")}>
              {icon}
            </div>
          </div>

          {/* Label */}
          <p className={twMerge(
            "font-medium text-white/80 flex items-center justify-center",
            compact ? "text-xs min-h-[2rem] mb-1" : "text-sm min-h-[2.75rem] mb-2",
          )}>
            {label}
          </p>

          {/* Value */}
          <p className={twMerge(
            "font-bold text-white tracking-tight",
            compact ? "text-xl" : "text-3xl",
          )}>
            {value}
          </p>

          {/* Sublabel */}
          {sublabel && (
            <p className={twMerge("text-white/60 mt-1", compact ? "text-[10px]" : "text-xs")}>
              {sublabel}
            </p>
          )}
        </Tag>
      </div>

      {tooltip && tooltipPos.visible && createPortal(
        <div
          className="pointer-events-none fixed z-[9999] max-w-xs rounded-lg bg-[#151F26]/90 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-sm"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y + 14 }}
        >
          {tooltip}
        </div>,
        document.body
      )}
    </>
  );
}
