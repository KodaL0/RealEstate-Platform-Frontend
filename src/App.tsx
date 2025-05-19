import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import AuthTokenProcessor from "./components/AuthTokenProcessor";
import AboutUs from './pages/AboutUs';
import TermsandConditions from "./pages/TermsandConditions"; 

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

function App() {
  return (
    <UserProvider>
      <Router>
        <AuthTokenProcessor />
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
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
