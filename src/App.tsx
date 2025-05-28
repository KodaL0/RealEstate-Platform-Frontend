import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import LoginWebViewWarning from "./components/LoginWebViewWarning";
import { UserProvider } from "./context/UserContext";
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
import AboutUs from "./pages/AboutUs";
import TermsandConditions from "./pages/TermsandConditions";
import CookiePolicy from "./pages/CookiePolicy";

function RouteChangeTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", { page_path: pathname + search });
    }
  }, [pathname, search]);
  return null;
}

export default function App() {
  return (
    <UserProvider>
      <Router>
        <RouteChangeTracker />
        <ScrollToTop />
        <LoginWebViewWarning />

        <div className="min-h-screen flex flex-col">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/buy" element={<Buy />} />
              <Route path="/rent" element={<Rent />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/terms" element={<TermsandConditions />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/mortgage-calculator" element={<MortgageCalculator />} />

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
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </UserProvider>
  );
}

