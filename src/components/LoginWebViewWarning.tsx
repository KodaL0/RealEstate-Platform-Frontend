import { useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";

const LOGIN_URL = "https://www.propertpro.com/login";

function isInWebView() {
  const ua = navigator.userAgent || navigator.vendor;
  return /FBAN|FBAV|Instagram|LinkedInApp|Line|Twitter|Snapchat|WebView|TikTok|WeChat/i.test(
    ua
  );
}

function buildAndroidIntent(url: string) {
  // Strip protocol for the intent syntax
  const stripped = url.replace(/^https?:\/\//, "");
  return `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`;
}

export default function LoginWebViewWarning() {
  const { pathname } = useLocation();
  const isWebView = useMemo(isInWebView, []);
  const [showModal, setShowModal] = useState(false);

  // ⬇︎ Kick off the redirect as soon as we land on /login inside a web-view
  useEffect(() => {
    if (pathname === "/login" && isWebView) {
      setShowModal(true);

      // One-shot auto-redirect (fails silently in some web-views)
      if (/Android/i.test(navigator.userAgent)) {
        window.location.href = buildAndroidIntent(LOGIN_URL);
      } else {
        // iOS & desktop: open a new tab - some views still block it,
        // but it works in SafariViewController / SFSafari.
        window.open(LOGIN_URL, "_blank", "noopener,noreferrer");
      }
    } else {
      setShowModal(false);
    }
  }, [pathname, isWebView]);

  // ---- UI fallback ----
  if (!showModal) return null;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(LOGIN_URL);
      alert("URL copied – paste it in your browser.");
    } catch {
      alert("Copy failed – type the URL manually.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="webview-warning-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,.3)",
        }}
      >
        <h2 id="webview-warning-title" style={{ marginBottom: 16 }}>
          Embedded Browser Detected
        </h2>
        <p style={{ marginBottom: 16 }}>
          Google sign-in rarely works inside this in-app browser. We tried to
          launch your default browser automatically.
        </p>

        <button
          onClick={() => (window.location.href = LOGIN_URL)}
          style={{
            marginBottom: 12,
            padding: "10px 20px",
            border: "none",
            borderRadius: 4,
            background: "#2563eb",
            color: "#fff",
            fontSize: "1em",
            cursor: "pointer",
          }}
        >
          Open in Browser
        </button>

        <div style={{ marginBottom: 16 }}>
          <code>{LOGIN_URL}</code>
        </div>

        <button
          onClick={copyUrl}
          style={{
            marginRight: 8,
            padding: "8px 16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Copy URL
        </button>

        <button
          onClick={() => setShowModal(false)}
          style={{
            padding: "8px 16px",
            background: "#e2e8f0",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Stay Here
        </button>
      </div>
    </div>
  );
}
