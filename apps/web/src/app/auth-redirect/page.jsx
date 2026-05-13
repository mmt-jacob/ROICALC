import { useEffect } from "react";
import { msalInstance } from "@/utils/msalConfig";

export default function AuthRedirect() {
  useEffect(() => {
    msalInstance.initialize()
      .then(() => msalInstance.handleRedirectPromise())
      .then(() => {
        // Give MSAL time to post the token message to the parent window before closing
        setTimeout(() => window.close(), 500);
      })
      .catch((err) => {
        console.error("Auth redirect error:", err);
        window.close();
      });
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#636D78" }}>
      Signing in…
    </div>
  );
}
