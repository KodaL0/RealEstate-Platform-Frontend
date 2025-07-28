import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from 'react-hot-toast';

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import LoginWebViewWarning from "./components/LoginWebViewWarning";
import { RequireAuth } from "./components/RequireAuth";

import Home from "./pages/Home";
import Buy from "./pages/Buy";
import Rent from "./pages/Rent";
import PropertyDetails from "./pages/PropertyDetails";
import { AuthPage } from "./pages/AuthPage";
import OAuthCallback from "./pages/OAuthCallback";
import ProfilePage from "./pages/ProfilePage";
import Favourites from "./pages/Favourites";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import MortgageCalculator from "./pages/MortgageCalculator";
import RentVsBuyPage from "./pages/RentvsBuypage";
import AboutUs from "./pages/AboutUs";
import TermsandConditions from "./pages/TermsandConditions";
import CookiePolicy from "./pages/CookiePolicy";
import ChatContainer from './pages/ChatContainer';
import PublicProfile from "./pages/PublicProfile";
import Connections from "./pages/Connections";

import { EmailVerification } from "./components/EmailVerification";
import Developers from "./pages/Developers";



function RouteChangeTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", { page_path: pathname + search });
    }
  }, [pathname, search]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');

  return (
   <div className="h-full flex flex-col">
      <Navbar />

      <main className={`relative ${isChatRoute ? "h-full" : "flex-grow"}`}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/rent" element={<Rent />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/terms" element={<TermsandConditions />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
          <Route path="/rent-vs-buy" element={<RentVsBuyPage />} />
          <Route path="/developer" element={<Developers />} />
          
          {/* Chat routes - Protected and handled by ChatContainer */}
          <Route
            path="/chat/*"
            element={
              <RequireAuth>
                <ChatContainer />
              </RequireAuth>
            }
          />

          {/* Protected */}
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/favourites"
            element={
              <RequireAuth>
                <Favourites />
              </RequireAuth>
            }
          />
          <Route
            path="/create-listing"
            element={
              <RequireAuth>
                <CreateListing />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-listing/:id"
            element={
              <RequireAuth>
                <CreateListing />
              </RequireAuth>
            }
          />
          <Route
            path="/my-listings"
            element={
              <RequireAuth>
                <MyListings />
              </RequireAuth>
            }
          />
          <Route
            path="/connections"
            element={
              <RequireAuth>
                <Connections />
              </RequireAuth>
            }
          />

          {/* Public profile route - must be last to avoid conflicts */}
          <Route path="/:username" element={<PublicProfile />} />
        </Routes>
      </main>

      {/* Only show footer when NOT on chat routes */}
      {!isChatRoute && <Footer />}
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <RouteChangeTracker />
      <ScrollToTop />
      <LoginWebViewWarning />
      <AppContent />
    </Router>
  );
}

