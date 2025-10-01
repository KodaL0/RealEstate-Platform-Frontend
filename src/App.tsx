import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from 'react-hot-toast';

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { RequireAuth } from "./components/RequireAuth";

import Home from "./pages/Home";
import Buy from "./pages/Buy";
import Rent from "./pages/Rent";
import PropertyDetails from "./pages/PropertyDetails";
import { AuthPage } from "./pages/AuthPage";
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
import DeveloperProjects from "./pages/DeveloperProjects";
import DeveloperDetail from "./pages/DeveloperDetail";
import ProjectDetail from "./pages/ProjectDetail";
import DeveloperPortal from "./developer-api/DeveloperPortal";
import { RequireDeveloper } from "./components/RequireAuth";



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
  const isDeveloperRoute = location.pathname.startsWith('/developer-api');

  return (
   <div className="h-full flex flex-col">
      {!isDeveloperRoute && <Navbar />}

      <main className={`relative ${!isDeveloperRoute ? 'pt-[var(--navbar-height)]' : ''} ${isChatRoute ? "h-full" : "flex-grow"}`}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/rent" element={<Rent />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/login" element={<AuthPage />} />
          {/* OAuth callback route no longer needed; handled entirely server-side */}
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/terms" element={<TermsandConditions />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
          <Route path="/rent-vs-buy" element={<RentVsBuyPage />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/developers/:orgSlug/:projectSlug" element={<ProjectDetail />} />
          <Route path="/developer/:id" element={<DeveloperDetail />} />
          <Route path="/developers/:identifier" element={<DeveloperDetail />} />
          <Route path="/projects" element={<DeveloperProjects />} />
          <Route
            path="/developer-api/*"
            element={
              <RequireDeveloper>
                <DeveloperPortal />
              </RequireDeveloper>
            }
          />
          
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
          <Route path="/:username/:tab?" element={<PublicProfile />} />
        </Routes>
      </main>

      {/* Footer visible on all routes except chat and developer portal */}
      {!isChatRoute && !isDeveloperRoute && <Footer />}
      
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
      <AppContent />
    </Router>
  );
}

