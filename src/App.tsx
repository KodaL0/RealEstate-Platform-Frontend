import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Buy from "./pages/Buy";
import Rent from "./pages/Rent";
import PropertyDetails from "./pages/PropertyDetails";
import { AuthPage } from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage"; 
import Favourites from './pages/Favourites'; 
import { UserProvider } from './context/UserContext'; // Import UserProvider
import CreateListing from "./pages/CreateListing";
import { Analytics } from "@vercel/analytics/react"

import MyListings from "./pages/MyListings"; // Import MyListings component
import ScrollToTop from "./components/ScrollToTop"; // ✅ Import ScrollToTop
import MortgageCalculator from "./pages/MortgageCalculator"; // Import MortgageCalculator

function App() {
  return (
    <UserProvider> {/* Wrap your app with UserProvider */}
      <Router>
        <ScrollToTop /> {/* ✅ Use ScrollToTop */}
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
              {/* New edit route reusing CreateListing so existing data can be preloaded */}
              <Route path="/edit-listing/:id" element={<CreateListing />} />
              <Route path="/favourites" element={<Favourites />} /> 
              <Route path="/my-listings" element={<MyListings />} /> {/* Add MyListings route */}
              <Route path="/mortgage-calculator" element={<MortgageCalculator />} /> {/* Add Mortgage Calculator route */}
            </Routes>
          </main>
          <Footer />
        </div>
       <Analytics />
      </Router>
    </UserProvider>
  );
}

export default App;
