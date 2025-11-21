// LoginWebViewWarning.tsx

import { useMemo } from "react";
import { useLocation } from "react-router-dom";

const TARGET_URL = "https://www.propertpro.com";

/* ---------- helpers ---------- */
const isInWebView = (): boolean => {
  const ua = navigator.userAgent || navigator.vendor || "";
  return /FBAN|FBAV|Instagram|LinkedInApp|Line|Twitter|Snapchat|WebView|TikTok|WeChat/i.test(ua);
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _isAndroid = () => /Android/i.test(navigator.userAgent);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);

/* ---------- component ---------- */
const LoginWebViewWarning = () => {
  /* 1. No auto-redirect: many in-app browsers block intents and break back navigation */
  // Keep only a user-driven option via the modal below.

  /* 2. Fallback modal if still inside the WebView */
  const location = useLocation();
  const showWarning = useMemo(
    () => location.pathname === "/login" && isInWebView(),
    [location.pathname],
  );

  const copyToClipboard = () => {
    if ("clipboard" in navigator) {
      navigator.clipboard
        .writeText(TARGET_URL)
        .then(() => alert("URL copied to clipboard!"))
        .catch(() => alert("Copy failed. Please copy manually."));
    } else {
      alert("Clipboard API not supported");
    }
  };

  if (!showWarning) return null;

  /* 3. Modal */
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="webview-warning-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          maxWidth: 400,
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <h2
          id="webview-warning-title"
          style={{ marginBottom: 16, fontSize: "1.5em", color: "#333" }}
        >
          Embedded Browser Notice
        </h2>
        <p style={{ marginBottom: 20, fontSize: "1em", color: "#555" }}>
          You're inside an in-app browser. Google Sign-in rarely works here.
        </p>
        <p style={{ marginBottom: 20, fontSize: "1em", color: "#555" }}>
          Copy the link or tap "Open in Browser".
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <span style={{ marginRight: 10, fontSize: "1em", color: "#333" }}>{TARGET_URL}</span>
          <button
            type="button"
            onClick={copyToClipboard}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "8px 16px",
              fontSize: "1em",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#1e4bb8";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#2563eb";
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "#1e4bb8";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "#2563eb";
            }}
          >
            Copy URL
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.open(TARGET_URL, "_blank", "noopener,noreferrer")}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "10px 20px",
            fontSize: "1em",
            cursor: "pointer",
            marginRight: 10,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#1e4bb8";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#2563eb";
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = "#1e4bb8";
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = "#2563eb";
          }}
        >
          Open in Browser
        </button>

        <button
          type="button"
          onClick={() => window.history.back()}
          style={{
            background: "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "10px 20px",
            fontSize: "1em",
            cursor: "pointer",
            marginTop: 10,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#6b7280";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#9ca3af";
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = "#6b7280";
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = "#9ca3af";
          }}
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
};

export default LoginWebViewWarning;
