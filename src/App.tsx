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
import BlogPage from "./pages/BlogPage";

import { EmailVerification } from "./components/EmailVerification";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import Developers from "./pages/Developers";
import DeveloperProjects from "./pages/DeveloperProjects";
import DeveloperDetail from "./pages/DeveloperDetail";
import ProjectDetail from "./pages/ProjectDetail";
import SitemapViewer from "./pages/SitemapViewer";
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
  const isCreateListingRoute = location.pathname.startsWith('/create-listing') || location.pathname.startsWith('/edit-listing');
  const { user, isLoading } = useUser();
  
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Legal documents hook
  const { acceptanceStatus, needsAcceptance, checkAcceptanceStatus } = useLegalDocuments();

  // Unified initialization effect - waits for user loading before deciding which modal to show
  useEffect(() => {
    initializeApp();
  }, [user, isLoading, needsAcceptance, acceptanceStatus]);

  // Handle login state change - when user logs in while consent banner is showing
  useEffect(() => {
    if (user && showConsentBanner) {
      // User just logged in while consent banner was showing
      console.log('[App] User logged in, hiding consent banner and re-initializing');
      setShowConsentBanner(false);
      // Re-initialize to check legal docs
      initializeApp();
    }
  }, [user?.id]);

  const initializeApp = async () => {
    // Wait for UserContext to finish loading
    if (isLoading) {
      setIsInitializing(true);
      return;
    }
    
    // User has loaded (or confirmed no user)
    setIsInitializing(false);
    
    // Decision tree: which modal to show?
    if (user) {
      // LOGGED IN USER
      // - Don't show consent banner (legitimate interest applies)
      // - Check if legal docs need acceptance
      console.log('[App] User is logged in, checking legal document acceptance status');
      
      if (needsAcceptance && acceptanceStatus) {
        const hasRequiredDocs = (acceptanceStatus.needs_acceptance_required?.length || 0) > 0;
        const hasOptionalDocs = (acceptanceStatus.needs_acceptance_optional?.length || 0) > 0;
        
        if (hasRequiredDocs || hasOptionalDocs) {
          console.log('[App] Legal documents need acceptance:', {
            required: acceptanceStatus.needs_acceptance_required,
            optional: acceptanceStatus.needs_acceptance_optional
          });
          setShowConsentBanner(false);
          setShowDocumentsModal(true);
          return;
        }
      }
      
      // User is logged in and has accepted all docs
      console.log('[App] User is logged in and has accepted all documents');
      setShowConsentBanner(false);
      setShowDocumentsModal(false);
      consentManager.initializeOnLoad();
    } else {
      // ANONYMOUS USER
      // - Show consent banner if needed
      // - Never show legal docs modal
      console.log('[App] Anonymous user, checking consent status');
      const needsConsent = !consentManager.hasConsent();
      setShowConsentBanner(needsConsent);
      setShowDocumentsModal(false);
      
      if (!needsConsent) {
        console.log('[App] Anonymous user has already given consent');
        consentManager.initializeOnLoad();
      } else {
        console.log('[App] Anonymous user needs to give consent');
      }
    }
  };

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
    
    // Refresh acceptance status - FORCE skip cache to get fresh data
    await checkAcceptanceStatus(true);
    
    console.log('[App] Acceptance status refreshed');
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
   <div className="h-full flex flex-col">
      {/* Show consent banner if needed - appears above everything */}
      {showConsentBanner && (
        <ConsentBanner 
          onConsent={handleConsent}
          isAuthenticated={!!user}
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
          <Route path="/buy/*" element={<Buy />} />
          <Route path="/rent/*" element={<Rent />} />
          {/* Legacy property URL - redirects to new format */}
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
          <Route path="/sitemap-view" element={<SitemapViewer />} />
          <Route path="/sitemap" element={<SitemapViewer />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/developers/:orgSlug/:projectSlug" element={<ProjectDetail />} />
          <Route path="/developer/:id" element={<DeveloperDetail />} />
          <Route path="/developers/:identifier" element={<DeveloperDetail />} />
          <Route path="/projects" element={<DeveloperProjects />} />
          <Route path="/blog" element={<BlogPage />} />
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

          {/* Public profile route - must come before property route to catch 1-2 segment URLs */}
          <Route path="/:username/:tab?" element={<PublicProfile />} />
          
          {/* Property detail route with new URL format: /username/country/location-type-id */}
          {/* This MUST come after profile route since it requires exactly 3 segments */}
          <Route path="/:username/:country/:locationSlug" element={<PropertyDetails />} />
        </Routes>
      </main>

      {/* Footer visible on all routes except chat, developer portal, and create/edit listing */}
      {!isChatRoute && !isDeveloperRoute && !isCreateListingRoute && <Footer />}
      
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

