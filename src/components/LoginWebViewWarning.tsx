import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// Detect if we're in a webview
function isInWebView() {
  const userAgent = navigator.userAgent || navigator.vendor;
  // Common webview patterns (add more as needed)
  return (
    /FBAN|FBAV|Instagram|LinkedInApp|Line|Twitter|Snapchat|WebView/i.test(userAgent)
  );
}

const LoginWebViewWarning = () => {
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (location.pathname === "/login" && isInWebView()) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [location.pathname]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText("www.propertpro.com");
    alert("URL copied to clipboard!");
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.7)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        padding: 24,
        borderRadius: 8,
        maxWidth: 400,
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{marginBottom: 16, fontSize: '1.5em', color: '#333'}}>Embedded Browser Notice</h2>
        <p style={{marginBottom: 20, fontSize: '1em', color: '#555'}}>
          You are using an embedded browser (LinkedIn). Google sign-in may not work correctly in this environment. 
          We've removed the redirect to default browser for testing purposes.
        </p>
        <p style={{marginBottom: 20, fontSize: '1em', color: '#555'}}>
          Please copy the URL below and paste it into your default browser:
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}>
          <span style={{marginRight: 10, fontSize: '1em', color: '#333'}}>www.propertpro.com</span>
          <button
            onClick={copyToClipboard}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '8px 16px',
              fontSize: '1em',
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#1e4bb8'}
            onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
          >
            Copy URL
          </button>
        </div>
        <button
          onClick={() => setShowWarning(false)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '10px 20px',
            fontSize: '1em',
            cursor: 'pointer',
            transition: 'background 0.3s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1e4bb8'}
          onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
};

export default LoginWebViewWarning; 