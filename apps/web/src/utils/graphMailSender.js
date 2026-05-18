import { InteractionRequiredAuthError, BrowserAuthError } from "@azure/msal-browser";
import { msalInstance, GRAPH_MAIL_SCOPES } from "./msalConfig";

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await msalInstance.initialize();
    initialized = true;
  }
}

function clearInteractionLock() {
  Object.keys(sessionStorage)
    .filter((k) => k.toLowerCase().includes("interaction"))
    .forEach((k) => sessionStorage.removeItem(k));
}

// Call this when the email modal opens — silently refreshes a cached token if one
// exists. Does NOT use ssoSilent (hidden iframe) because Azure SWA's cross-origin
// iframe sandboxing blocks that flow. Fresh logins are handled by acquireTokenPopup
// when the user clicks Send.
export async function warmUpAuth() {
  try {
    await ensureInitialized();
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return; // no cached account — nothing to do
    await msalInstance.acquireTokenSilent({
      scopes: GRAPH_MAIL_SCOPES,
      account: accounts[0],
    });
  } catch {
    // Silently ignored — warmup is best-effort
  }
}

export async function acquireGraphToken() {
  await ensureInitialized();
  const accounts = msalInstance.getAllAccounts();
  console.log("Accounts:", accounts);

  // 1. Cached token — fully silent, no network call
  if (accounts.length > 0) {
    try {
      const result = await msalInstance.acquireTokenSilent({
        scopes: GRAPH_MAIL_SCOPES,
        account: accounts[0],
      });
      console.log("Token acquired (silent):", result);
      return result.accessToken;
    } catch (err) {
      if (!(err instanceof InteractionRequiredAuthError)) throw err;
    }
  }

  // 2. Popup — must be called directly within a user gesture to avoid browser blocking
  try {
    console.log("[Auth] Before popup accounts:", msalInstance.getAllAccounts());
    const result = await msalInstance.acquireTokenPopup({ scopes: GRAPH_MAIL_SCOPES });
    console.log("[Auth] Popup result:", result);
    console.log("[Auth] Result account:", result.account);
    console.log("[Auth] After popup accounts:", msalInstance.getAllAccounts());
    console.log("Token acquired (popup):", result);
    return result.accessToken;
  } catch (err) {
    // A previous popup was abandoned and left an interaction lock — clear it and retry once
    if (err instanceof BrowserAuthError && err.errorCode === "interaction_in_progress") {
      clearInteractionLock();
      console.log("[Auth] Before popup retry accounts:", msalInstance.getAllAccounts());
      const result = await msalInstance.acquireTokenPopup({ scopes: GRAPH_MAIL_SCOPES });
      console.log("[Auth] Popup retry result:", result);
      console.log("[Auth] Result account:", result.account);
      console.log("[Auth] After popup retry accounts:", msalInstance.getAllAccounts());
      console.log("Token acquired (popup retry):", result);
      return result.accessToken;
    }
    throw err;
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

  console.log("Calling Graph...");
  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  console.log("Email API response:", res.status, res.statusText);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API error ${res.status}: ${text}`);
  }
}
