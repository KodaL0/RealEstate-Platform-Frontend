import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from 'react-hot-toast';

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ConsentBanner from "./components/ConsentBanner";
import RequiredDocumentsModal from "./components/RequiredDocumentsModal";
import { RequireAuth } from "./components/RequireAuth";
import { useUser } from "./context/UserContext";
import consentManager, { ConsentPreferences } from "./services/ConsentManager";
import { useLegalDocuments } from "./hooks/useLegalDocuments";

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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import PrivacySettings from "./pages/PrivacySettings";
import ChatContainer from './pages/ChatContainer';
import PublicProfile from "./pages/PublicProfile";
import Connections from "./pages/Connections";

import { EmailVerification } from "./components/EmailVerification";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import Developers from "./pages/Developers";
import DeveloperProjects from "./pages/DeveloperProjects";
import DeveloperDetail from "./pages/DeveloperDetail";
import ProjectDetail from "./pages/ProjectDetail";
import DeveloperPortal from "./developer-api/DeveloperPortal";
import { RequireDeveloper } from "./components/RequireAuth";



function RouteChangeTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    // Only track page views if analytics consent is given
    if (consentManager.isAnalyticsEnabled() && typeof window.gtag === "function") {
      window.gtag("event", "page_view", { page_path: pathname + search });
    }
  }, [pathname, search]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');
  const isDeveloperRoute = location.pathname.startsWith('/developer-api');
  const { user } = useUser();
  
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  
  // Legal documents hook
  const { acceptanceStatus, needsAcceptance, checkAcceptanceStatus } = useLegalDocuments();

  // Check if consent banner should be shown
  useEffect(() => {
    const needsConsent = !consentManager.hasConsent();
    setShowConsentBanner(needsConsent);
    
    // If consent already given, initialize analytics on load
    if (!needsConsent) {
      consentManager.initializeOnLoad();
    }
  }, []);

  // Check if legal documents need acceptance when user logs in
  useEffect(() => {
    if (user && needsAcceptance && acceptanceStatus) {
      // Only show modal if there are actually documents to accept
      const hasRequiredDocs = (acceptanceStatus.needs_acceptance_required?.length || 0) > 0;
      const hasOptionalDocs = (acceptanceStatus.needs_acceptance_optional?.length || 0) > 0;
      
      if (hasRequiredDocs || hasOptionalDocs) {
        console.log('Legal documents need acceptance:', {
          required: acceptanceStatus.needs_acceptance_required,
          optional: acceptanceStatus.needs_acceptance_optional
        });
        
        // Show modal after a short delay to ensure user sees it
        const timer = setTimeout(() => {
          setShowDocumentsModal(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        console.log('No documents need acceptance');
      }
    }
  }, [user?.id, needsAcceptance, acceptanceStatus?.needs_acceptance_required?.length]);

  // Handle consent choice
  const handleConsent = async (consents: ConsentPreferences) => {
    console.log('🎯 [App] handleConsent called with:', JSON.stringify(consents));
    console.log('🎯 [App] User authenticated:', !!user, user ? `(ID: ${user.id})` : '(anonymous)');
    
    try {
      // Save consents (with userId if authenticated)
      console.log('⏳ [App] Calling ConsentManager.saveConsents...');
      const success = await consentManager.saveConsents(consents, user?.id);
      console.log('📊 [App] ConsentManager.saveConsents result:', success);
      
      if (success) {
        setShowConsentBanner(false);
        console.log('✅ [App] Consent saved successfully. Banner hidden.');
        
        // Sync anonymous consent to backend session
        if (!user) {
          console.log('⏳ [App] Syncing anonymous consent to backend...');
          const syncSuccess = await consentManager.syncAnonymousConsent();
          console.log('📊 [App] Backend sync result:', syncSuccess);
        } else {
          console.log('ℹ️ [App] User is authenticated - consent already synced to backend via API');
        }
      } else {
        console.error('❌ [App] Failed to save consent');
      }
    } catch (error) {
      console.error('❌ [App] Error handling consent:', error);
    }
  };

  const handleDocumentsAccepted = async () => {
    console.log('[App] Documents accepted, refreshing status...');
    setShowDocumentsModal(false);
    
    // Small delay to ensure backend has processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Refresh acceptance status (this will clear cache and re-fetch)
    await checkAcceptanceStatus();
    
    console.log('[App] Acceptance status refreshed');
  };

  return (
   <div className="h-full flex flex-col">
      {/* Show consent banner if needed - appears above everything */}
      {showConsentBanner && (
        <ConsentBanner 
          onConsent={handleConsent}
        />
      )}

      {/* Show legal documents modal if user needs to accept documents */}
      {showDocumentsModal && acceptanceStatus && 
       ((acceptanceStatus.needs_acceptance_required?.length || 0) > 0 || 
        (acceptanceStatus.needs_acceptance_optional?.length || 0) > 0) && (
        <RequiredDocumentsModal
          documentsToAccept={acceptanceStatus.needs_acceptance_required || acceptanceStatus.needs_acceptance || []}
          optionalDocuments={acceptanceStatus.needs_acceptance_optional || []}
          onClose={() => setShowDocumentsModal(false)}
          onAcceptAll={handleDocumentsAccepted}
        />
      )}
      
      {!isDeveloperRoute && <Navbar />}

      <main className={`relative ${!isDeveloperRoute ? 'pt-[var(--navbar-height)]' : ''} ${isChatRoute ? "h-full" : "flex-grow"}`}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/rent" element={<Rent />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          {/* OAuth callback route no longer needed; handled entirely server-side */}
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/legal/terms-conditions/" element={<TermsandConditions />} />
          <Route path="/legal/terms-conditions" element={<Navigate to="/legal/terms-conditions/" replace />} />
          <Route path="/terms" element={<Navigate to="/legal/terms-conditions/" replace />} />
          <Route path="/legal/privacy-policy/" element={<PrivacyPolicy />} />
          <Route path="/legal/privacy-policy" element={<Navigate to="/legal/privacy-policy/" replace />} />
          <Route path="/privacy" element={<Navigate to="/legal/privacy-policy/" replace />} />
          <Route path="/legal/cookie-policy/" element={<CookiePolicy />} />
          <Route path="/legal/cookie-policy" element={<Navigate to="/legal/cookie-policy/" replace />} />
          <Route path="/cookies" element={<Navigate to="/legal/cookie-policy/" replace />} />
          <Route path="/privacy-settings" element={<PrivacySettings />} />
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

