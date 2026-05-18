import { PublicClientApplication } from "@azure/msal-browser";

export const GRAPH_MAIL_SCOPES = ["Mail.Send"];

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: "https://login.microsoftonline.com/dd1ca075-de8f-40c4-bebb-c90103860dba",
    redirectUri: typeof window !== "undefined" ? `${window.location.origin}/auth-redirect.html` : "",
  },
  cache: {
    cacheLocation: "localStorage",
    temporaryCacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
});

msalInstance.initialize().catch(() => {});
