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

function App() {
  const [showWebViewWarning, setShowWebViewWarning] = useState(false);

  useEffect(() => {
    if (isInWebView()) {
      setShowWebViewWarning(true);
    }
  }, []);

  const openInBrowser = () => {
    // Try to open in default browser using a universal link
    window.location.href = window.location.href;
  };

  return (
    <UserProvider>
      {showWebViewWarning && (
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
            maxWidth: 350,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{marginBottom: 12}}>Open in Browser Required</h2>
            <p style={{marginBottom: 20}}>
              Google sign-in is not supported in this browser. For your security, please open this page in your device's main browser (e.g., Chrome or Safari) to log in with Google. This is required by Google to protect your account.
            </p>
            <button
              onClick={openInBrowser}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '10px 20px',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Open in Default Browser
            </button>
          </div>
        </div>
      )}
      <Router>
        {/* Track route changes for GA */}
        <RouteChangeTracker />
        <ScrollToTop />

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
