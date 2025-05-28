import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Buy from "./pages/Buy";
import Rent from "./pages/Rent";
import PropertyDetails from "./pages/PropertyDetails";
import { AuthPage } from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import Favourites from "./pages/Favourites";
import { UserProvider } from "./context/UserContext";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import MortgageCalculator from "./pages/MortgageCalculator";
import ScrollToTop from "./components/ScrollToTop";
import AboutUs from './pages/AboutUs';
import TermsandConditions from "./pages/TermsandConditions";
import CookiePolicy from "./pages/CookiePolicy";
import OAuthCallback from "./pages/OAuthCallback";

function RouteChangeTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window.gtag === "function") {
      // Sends a page_view event on every route change
      window.gtag("event", "page_view", {
        page_path: pathname + search,
      });
    }
  }, [pathname, search]);

  return null;
}

function isInWebView() {
  const userAgent = navigator.userAgent || navigator.vendor;
  // Common webview patterns (add more as needed)
  return (
    /FBAN|FBAV|Instagram|LinkedInApp|Line|Twitter|Snapchat|WebView/i.test(userAgent)
  );
}

function LoginWebViewWarning() {
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
}

function App() {
  return (
    <UserProvider>
      <Router>
        {/* Track route changes for GA */}
        <RouteChangeTracker />
        <ScrollToTop />
        <LoginWebViewWarning />

        <div className="min-h-screen flex flex-col">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/buy" element={<Buy />} />
              <Route path="/rent" element={<Rent />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/edit-listing/:id" element={<CreateListing />} />
              <Route path="/favourites" element={<Favourites />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/terms" element={<TermsandConditions />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route
                path="/mortgage-calculator"
                element={<MortgageCalculator />}
              />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
