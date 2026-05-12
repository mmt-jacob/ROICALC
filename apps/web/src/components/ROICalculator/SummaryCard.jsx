import { useRef, useCallback } from "react";
import { twMerge } from "tailwind-merge";

const EDGE_THRESHOLD = 55;

export function SummaryCard({ label, sublabel, value, icon, color, compact, fullWidth, href }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const distToEdge = Math.min(x, width - x, y, height - y);
    const opacity = distToEdge >= EDGE_THRESHOLD
      ? 0
      : parseFloat((1 - distToEdge / EDGE_THRESHOLD).toFixed(3));
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
    card.style.setProperty("--glow-opacity", opacity);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--glow-opacity", 0);
  }, []);

  const Tag = href ? "a" : "div";
  const linkProps = href ? { href, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Tag
      {...linkProps}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={twMerge(
        "reveal-card rounded-2xl shadow-lg flex flex-col items-center text-center select-none",
        compact ? "p-4 col-span-1" : "p-6 h-full",
        fullWidth && "col-span-2",
        href && "cursor-pointer",
        color,
      )}
    >
      {/* Icon — fixed height so all cards have same icon baseline */}
      <div className={twMerge("flex-shrink-0", compact ? "mb-2" : "mb-3")}>
        <div className={twMerge("rounded-xl bg-white/20 inline-block", compact ? "p-2" : "p-3")}>
          {icon}
        </div>
      </div>

      {/* Label — fixed min-height so value always starts at same y across all cards */}
      <p className={twMerge(
        "font-medium text-white/80 flex items-center justify-center",
        compact
          ? "text-xs min-h-[2rem] mb-1"
          : "text-sm min-h-[2.75rem] mb-2",
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
  );
}
