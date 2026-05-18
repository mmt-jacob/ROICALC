import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalInstance, GRAPH_MAIL_SCOPES } from "./msalConfig";

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await msalInstance.initialize();
    initialized = true;
  }
}

const PENDING_EMAIL_KEY = "steripath_pending_email";

export function savePendingEmail(payload) {
  localStorage.setItem(PENDING_EMAIL_KEY, JSON.stringify(payload));
}

export function getPendingEmail() {
  try {
    const raw = localStorage.getItem(PENDING_EMAIL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingEmail() {
  localStorage.removeItem(PENDING_EMAIL_KEY);
}

export async function warmUpAuth() {
  try {
    await ensureInitialized();
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return;
    await msalInstance.acquireTokenSilent({
      scopes: GRAPH_MAIL_SCOPES,
      account: accounts[0],
    });
  } catch {
    // Silently ignored — warmup is best-effort
  }
}

// Returns an access token via silent cache, or initiates a redirect and returns null.
// Callers must save any state they need before calling this, as the page may navigate away.
export async function acquireGraphToken() {
  await ensureInitialized();
  const accounts = msalInstance.getAllAccounts();

  if (accounts.length > 0) {
    try {
      const result = await msalInstance.acquireTokenSilent({
        scopes: GRAPH_MAIL_SCOPES,
        account: accounts[0],
      });
      return result.accessToken;
    } catch (err) {
      if (!(err instanceof InteractionRequiredAuthError)) throw err;
    }
  }

  // Clear any stale interaction/PKCE state left by previous failed attempts.
  // With temporaryCacheLocation: "localStorage", these keys land in localStorage.
  const tempPatterns = ["interaction", "request.", "pkce", "nonce.idtoken"];
  [sessionStorage, localStorage].forEach((store) => {
    Object.keys(store)
      .filter((k) => tempPatterns.some((p) => k.toLowerCase().includes(p)))
      .forEach((k) => store.removeItem(k));
  });

  // Redirect flow — navigates to Microsoft login. auth-redirect.html is used as the
  // redirect target because it has allowedRoles: ["anonymous"] in SWA, which prevents
  // SWA's auth middleware from stripping the ?code=&state= params before MSAL sees them.
  await msalInstance.acquireTokenRedirect({
    scopes: GRAPH_MAIL_SCOPES,
    redirectUri: `${window.location.origin}/auth-redirect.html`,
  });
  return null; // Never reached; page is navigating
}

// Called on app startup after a redirect. Processes the auth code in the URL,
// caches the token, and returns the result (or null if not a redirect callback).
export async function handlePostRedirect() {
  await ensureInitialized();
  try {
    const result = await msalInstance.handleRedirectPromise();
    console.log("[PostRedirect] handleRedirectPromise result:", result ? "got token for " + result.account?.username : "null");
    if (result?.account) {
      msalInstance.setActiveAccount(result.account);
    }
    return result;
  } catch (err) {
    console.error("[PostRedirect] handleRedirectPromise error:", err);
    return null;
  }
}

// Silent-only token acquisition for the post-redirect completion path.
// Returns null instead of redirecting if no cached token is available.
export async function acquireGraphTokenSilent() {
  await ensureInitialized();
  const accounts = msalInstance.getAllAccounts();
  console.log("[PostRedirect] accounts in cache:", accounts.map(a => a.username));
  console.log("[PostRedirect] localStorage MSAL keys:", Object.keys(localStorage).filter(k => k.includes("msal")));
  if (accounts.length === 0) return null;
  try {
    const result = await msalInstance.acquireTokenSilent({
      scopes: GRAPH_MAIL_SCOPES,
      account: accounts[0],
    });
    console.log("[PostRedirect] silent token acquired for:", result.account?.username);
    return result.accessToken;
  } catch (err) {
    console.error("[PostRedirect] acquireTokenSilent failed:", err);
    return null;
  }
}

export function getSignedInAccount() {
  const accounts = msalInstance.getAllAccounts();
  return accounts[0] ?? null;
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function urlToBase64(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function sendEmailViaGraph({ accessToken, to, subject, bodyText, pdfBlob, pdfName, studies }) {
  const attachments = [];

  const pdfBase64 = await blobToBase64(pdfBlob);
  attachments.push({
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: pdfName,
    contentType: "application/pdf",
    contentBytes: pdfBase64,
  });

  for (const study of studies) {
    const base64 = await urlToBase64(study.file);
    const contentType = study.type === "pptx"
      ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      : "application/pdf";
    attachments.push({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: `${study.label}.${study.type}`,
      contentType,
      contentBytes: base64,
    });
  }

  const toRecipients = to
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean)
    .map((addr) => ({ emailAddress: { address: addr } }));

  const message = {
    subject,
    body: { contentType: "Text", content: bodyText },
    toRecipients,
    attachments,
  };

  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API error ${res.status}: ${text}`);
  }
}
