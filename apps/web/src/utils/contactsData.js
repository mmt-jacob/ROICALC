import Papa from "papaparse";

// Module-level cache — loaded once, reused forever
let cache = null;
let loadPromise = null;

export function loadContacts() {
  if (cache) return Promise.resolve(cache);
  if (loadPromise) return loadPromise;
  loadPromise = fetch("/contacts.csv")
    .then((res) => res.text())
    .then((text) => {
      const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
      cache = data
        .filter((r) => r.CONTACT_EMAIL?.trim())
        .map((r) => ({
          name:    r.CONTACT_NAME?.trim()  || "",
          email:   r.CONTACT_EMAIL?.trim() || "",
          title:   r.CONTACT_TITLE?.trim() || "",
          account: r.ACCOUNT_NAME?.trim()  || "",
        }));
      return cache;
    })
    .catch(() => []);
  return loadPromise;
}

/**
 * Returns up to `limit` contacts whose account fuzzy-matches `hospitalName`
 * and whose name or email contains `query`.
 */
export function filterContacts(contacts, hospitalName, query, limit = 8) {
  if (!query || query.length < 2) return [];

  // Build account filter from hospitalName words (min 2 chars each)
  const acctWords = hospitalName
    ? hospitalName.toLowerCase().split(/\s+/).filter((w) => w.length >= 2)
    : [];

  let pool = contacts;
  if (acctWords.length > 0) {
    pool = contacts.filter((c) => {
      const acct = c.account.toLowerCase();
      return acctWords.every((w) => acct.includes(w));
    });
    // Fall back to full list if the account name produced no matches
    if (pool.length === 0) pool = contacts;
  }

  const q = query.toLowerCase();
  return pool
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
