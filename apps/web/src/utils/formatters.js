export const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

export const formatCurrencyWhole = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);

export const formatNumber = (val) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);

export const formatCurrencyCompact = (val) => {
  const n = Math.abs(Number(val) || 0);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

export const formatCurrencyCompactSigned = (val) => {
  const n = Number(val) || 0;
  if (n === 0) return "—";
  const abs = Math.abs(n);
  let formatted;
  if (abs >= 1_000_000) formatted = `$${(abs / 1_000_000).toFixed(2)}M`;
  else if (abs >= 1_000) formatted = `$${Math.round(abs / 1_000)}K`;
  else formatted = `$${Math.round(abs).toLocaleString()}`;
  return n >= 0 ? `+${formatted}` : `–${formatted}`;
};
