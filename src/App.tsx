// src/App.jsx (or App.js)

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <UserProvider>
      <Router>
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
              <Route path="/my-listings" element={<MyListings />} />
              <Route
                path="/mortgage-calculator"
                element={<MortgageCalculator />}
              />
            </Routes>
          </main>

          <Footer />
        </div>

        {/* Vercel Analytics: place this at the root inside Router */}
        <Analytics />
      </Router>
    </UserProvider>
  );
}

export default App;
