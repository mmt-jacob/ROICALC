import { PublicClientApplication } from "@azure/msal-browser";

export const GRAPH_MAIL_SCOPES = ["Mail.Send"];

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: "https://login.microsoftonline.com/dd1ca075-de8f-40c4-bebb-c90103860dba",
    // Redirect URI is the app root — must also be registered as a SPA redirect URI
    // in the Azure App Registration (id: bd1a125d-bb30-4d9e-9194-93a475450c82).
    redirectUri: typeof window !== "undefined" ? window.location.origin : "",
  },
  cache: {
    cacheLocation: "localStorage",
    temporaryCacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
});

msalInstance.initialize().catch(() => {});
