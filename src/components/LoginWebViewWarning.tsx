// LoginWebViewWarning.tsx
import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const TARGET_URL = "https://www.propertpro.com/login";

/* ---------- helpers ---------- */
const isInWebView = (): boolean => {
  const ua = navigator.userAgent || navigator.vendor || "";
  return /FBAN|FBAV|Instagram|LinkedInApp|Line|Twitter|Snapchat|WebView|TikTok|WeChat/i.test(
    ua,
  );
};
const isAndroid = () => /Android/i.test(navigator.userAgent);
const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);

/* ---------- component ---------- */
const LoginWebViewWarning = () => {
  /* 1. Escape the in-app browser ASAP */
  useEffect(() => {
    if (!isInWebView()) return;

    const alreadyRedirected = new URLSearchParams(location.search).get("r") === "ext";
    if (alreadyRedirected) return; // stop loops

    let extURL = TARGET_URL;
    if (isAndroid()) {
      const stripped = TARGET_URL.replace(/^https?:\/\//, "");
      extURL =
        `intent://${stripped}?r=ext#Intent;scheme=https;package=com.android.chrome;end`;
    } else if (isIOS()) {
      extURL = `x-safari-${TARGET_URL}?r=ext`;
    }

    window.location.href = extURL;
  }, []);

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
          <span style={{ marginRight: 10, fontSize: "1em", color: "#333" }}>
            {TARGET_URL}
          </span>
          <button
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
            onMouseOver={(e) => (e.currentTarget.style.background = "#1e4bb8")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
          >
            Copy URL
          </button>
        </div>

        <button
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
          onMouseOver={(e) => (e.currentTarget.style.background = "#1e4bb8")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
        >
          Open in Browser
        </button>

        <button
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
          onMouseOver={(e) => (e.currentTarget.style.background = "#6b7280")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#9ca3af")}
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
};

export default LoginWebViewWarning;
