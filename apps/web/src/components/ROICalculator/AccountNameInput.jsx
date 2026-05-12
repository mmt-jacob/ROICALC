import { useState, useRef, useEffect } from "react";
import { ACCOUNT_NAMES } from "@/data/accountNames";

const MAX_RESULTS = 8;

function getMatches(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const starts = [];
  const contains = [];
  for (const name of ACCOUNT_NAMES) {
    const lower = name.toLowerCase();
    if (lower === q) { starts.unshift(name); continue; }
    if (lower.startsWith(q)) starts.push(name);
    else if (lower.includes(q)) contains.push(name);
    if (starts.length + contains.length >= MAX_RESULTS * 2) break;
  }
  return [...starts, ...contains].slice(0, MAX_RESULTS);
}

export function AccountNameInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMatches(getMatches(value));
  }, [value]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const exactMatch = ACCOUNT_NAMES.some(
    (n) => n.toLowerCase() === value.toLowerCase()
  );
  const showCreateNew = value.trim().length > 0 && !exactMatch;
  const hasDropdown = open && (matches.length > 0 || showCreateNew);

  function select(name) {
    onChange(name);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Portland VA Medical Center"
        className="w-full h-10 px-3 border border-[#CBCFD3] rounded-lg focus:outline-none focus:border-[#0061D5] focus:ring-2 focus:ring-[#0061D5]/10 text-[#151F26] text-sm"
      />

      {hasDropdown && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#CBCFD3] rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {matches.map((name) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(name)}
                className="w-full text-left px-3 py-2 text-sm text-[#151F26] hover:bg-[#EAF3FF] hover:text-[#0842A6] transition-colors"
              >
                {name}
              </button>
            </li>
          ))}
          {showCreateNew && (
            <li className="border-t border-[#CBCFD3]">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(value.trim())}
                className="w-full text-left px-3 py-2 text-sm text-[#0842A6] font-medium hover:bg-[#EAF3FF] transition-colors flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                Create New: <span className="font-semibold">"{value.trim()}"</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
